"""
DeepTrust — Real Deepfake Detection Server

FastAPI backend that performs actual deepfake detection using:
1. OpenCV face detection (Haar cascades)
2. Error Level Analysis (ELA) — forensic image tampering detection
3. Frequency domain analysis (DCT) — GAN artifact detection
4. Hugging Face AI classification — ViT deepfake vs real model

Run:  cd backend && ../backend/venv/bin/python server.py
"""

import hashlib
import time
import io
import sys
import os

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from detectors.face_detector import detect_faces
from detectors.ela_analyzer import analyze_ela
from detectors.frequency_analyzer import analyze_frequency
from detectors.ai_classifier import classify_deepfake

app = FastAPI(title="DeepTrust Detection API", version="2.0")

# Allow Next.js frontend to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif",
                 "video/mp4", "video/webm", "video/avi", "video/quicktime",
                 "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"}
MAX_SIZE = 100 * 1024 * 1024  # 100 MB


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0", "detectors": ["face", "ela", "frequency", "ai"]}


@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """
    Analyze an uploaded file for deepfake indicators.
    Returns comprehensive analysis results matching the frontend AnalysisResult interface.
    """
    start_time = time.time()

    # Validate content type
    content_type = file.content_type or ""
    if not any(content_type.startswith(t.split("/")[0]) for t in ALLOWED_TYPES):
        raise HTTPException(400, f"Unsupported file type: {content_type}")

    # Read file
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, f"File too large: {len(contents) / 1e6:.1f} MB (max 100 MB)")

    if len(contents) == 0:
        raise HTTPException(400, "Empty file uploaded")

    # Compute file hash
    file_hash = hashlib.sha256(contents).hexdigest()

    # Determine media type
    is_image = content_type.startswith("image/")
    is_video = content_type.startswith("video/")
    is_audio = content_type.startswith("audio/")

    # Initialize results
    face_result = {"face_count": 0, "faces": [], "detection_method": "none"}
    ela_result = {"manipulation_score": 0.0, "heatmap_data": [[0.0] * 12 for _ in range(8)], "artifacts": []}
    freq_result = {"spectral_anomaly": 0.0, "waveform_data": [0.0] * 60, "correlation_data": []}
    ai_result = {"success": False, "label": "unknown", "confidence": 0.0, "real_score": 0.0, "fake_score": 0.0}

    # ===== Run detectors =====
    if is_image:
        # Face detection
        face_result = detect_faces(contents)

        # Error Level Analysis
        ela_result = analyze_ela(contents)

        # Frequency analysis
        freq_result = analyze_frequency(contents)

        # AI Classification (Hugging Face)
        ai_result = classify_deepfake(contents)

    elif is_video:
        # For video: extract a frame and analyze it
        frame_bytes = _extract_video_frame(contents)
        if frame_bytes:
            face_result = detect_faces(frame_bytes)
            ela_result = analyze_ela(frame_bytes)
            freq_result = analyze_frequency(frame_bytes)
            ai_result = classify_deepfake(frame_bytes)

    elif is_audio:
        # Audio: frequency analysis only
        freq_result = analyze_frequency_from_audio(contents)

    # ===== Compute overall verdict =====
    verdict, confidence, explanation = _compute_verdict(
        face_result, ela_result, freq_result, ai_result,
        file.filename or "unknown", content_type
    )

    processing_time = (time.time() - start_time) * 1000  # ms

    # Format response to match frontend AnalysisResult interface
    response = {
        "verdict": verdict,
        "confidence": round(confidence, 4),
        "visual": {
            "score": round(ela_result.get("manipulation_score", 0.0), 4),
            "artifacts": ela_result.get("artifacts", []),
            "heatmapData": ela_result.get("heatmap_data", [[0.0] * 12 for _ in range(8)]),
        },
        "audio": {
            "score": round(freq_result.get("spectral_anomaly", 0.0), 4),
            "spectralAnomaly": round(freq_result.get("spectral_anomaly", 0.0), 4),
            "waveformData": freq_result.get("waveform_data", [0.0] * 60),
        },
        "crossModal": {
            "syncScore": round(1.0 - ela_result.get("manipulation_score", 0.0) * 0.5
                              - freq_result.get("spectral_anomaly", 0.0) * 0.5, 4),
            "correlationData": freq_result.get("correlation_data",
                [{"time": t, "visual": 0.5, "audio": 0.5} for t in range(30)]),
        },
        "blockchain": {
            "found": False,
            "hash": f"sha256:{file_hash[:32]}",
            "originalUploader": None,
            "timestamp": None,
            "chainValid": False,
        },
        "explanation": explanation,
        "processingTime": round(processing_time),
        "detectors": {
            "face_detection": face_result,
            "ai_classification": {
                "success": ai_result.get("success", False),
                "label": ai_result.get("label", "unknown"),
                "confidence": ai_result.get("confidence", 0.0),
                "real_score": ai_result.get("real_score", 0.0),
                "fake_score": ai_result.get("fake_score", 0.0),
                "method": ai_result.get("method", "none"),
            },
            "ela_score": ela_result.get("manipulation_score", 0.0),
            "frequency_score": freq_result.get("spectral_anomaly", 0.0),
        },
    }

    return JSONResponse(content=response)


def _compute_verdict(face_result, ela_result, freq_result, ai_result, filename, content_type):
    """
    Combine all detector results into a final verdict.
    The AI forensic classifier is the primary signal, with ELA and frequency
    as supporting evidence.
    """
    explanations = []

    face_count = face_result.get("face_count", 0)
    ela_score = ela_result.get("manipulation_score", 0.0)
    freq_score = freq_result.get("spectral_anomaly", 0.0)
    ai_success = ai_result.get("success", False)
    ai_label = ai_result.get("label", "unknown")
    ai_confidence = ai_result.get("confidence", 0.0)
    ai_fake_score = ai_result.get("fake_score", 0.0)
    ai_real_score = ai_result.get("real_score", 0.0)

    # --- AI Classification (primary signal) ---
    if ai_success:
        if ai_label == "fake":
            explanations.append(
                f"Forensic AI analysis detected deepfake/GAN artifacts "
                f"(fake score: {ai_fake_score*100:.1f}%, confidence: {ai_confidence*100:.1f}%). "
                f"Analysis found: {'; '.join(ai_result.get('details', [])[:2])}"
            )
        elif ai_label == "real":
            explanations.append(
                f"Forensic AI analysis indicates authentic content "
                f"(real score: {ai_real_score*100:.1f}%, confidence: {ai_confidence*100:.1f}%)."
            )
        else:
            explanations.append(
                f"Forensic AI analysis was inconclusive "
                f"(fake: {ai_fake_score*100:.1f}%, real: {ai_real_score*100:.1f}%)."
            )
    else:
        explanations.append("AI forensic classifier unavailable; using basic forensics only.")

    # --- Face Detection ---
    if content_type.startswith("image/") or content_type.startswith("video/"):
        if face_count > 0:
            face_confs = [f.get("confidence", 0) for f in face_result.get("faces", [])]
            avg_face_conf = sum(face_confs) / len(face_confs) if face_confs else 0
            explanations.append(
                f"Detected {face_count} face(s) via {face_result.get('detection_method', 'unknown')} "
                f"(avg confidence {avg_face_conf*100:.1f}%)."
            )
        else:
            explanations.append("No faces detected in the media.")

    # --- ELA ---
    if ela_score > 0.4:
        explanations.append(
            f"Error Level Analysis flagged manipulation indicators (score: {ela_score*100:.1f}%)."
        )
    elif ela_score > 0.15:
        explanations.append(
            f"ELA shows minor re-encoding artifacts ({ela_score*100:.1f}%)."
        )
    else:
        explanations.append(
            f"ELA shows consistent error levels ({ela_score*100:.1f}%) — no JPEG-level tampering."
        )

    # --- Frequency Analysis ---
    if freq_score > 0.4:
        explanations.append(
            f"Spectral analysis detected anomalous frequency patterns ({freq_score*100:.1f}%)."
        )
    elif freq_score > 0.15:
        explanations.append(
            f"Spectral analysis shows minor irregularities ({freq_score*100:.1f}%)."
        )

    # ===== COMPUTE FINAL VERDICT =====
    # The XceptionNet classifier is the primary signal (FaceForensics++ trained).
    # It produces very decisive outputs: ~99%+ for clear fakes, ~1% for clear reals.
    # We use higher thresholds to reduce false positives on real photos.

    if ai_success:
        # XceptionNet drives the verdict — use fake_score directly
        fs = ai_fake_score

        # Thresholds tuned for XceptionNet:
        #   fake_score > 0.75 → manipulated (model is very confident)
        #   fake_score 0.50-0.75 → suspicious (borderline, could be false positive)
        #   fake_score < 0.50 → authentic
        if fs > 0.75:
            verdict = "manipulated"
            confidence = min(0.99, 0.5 + fs * 0.49)
        elif fs > 0.50:
            verdict = "suspicious"
            confidence = min(0.85, 0.5 + (fs - 0.5) * 1.0)
        elif fs < 0.30:
            verdict = "authentic"
            confidence = min(0.99, 0.6 + (1.0 - fs) * 0.35)
        else:
            verdict = "uncertain"
            confidence = min(0.70, 0.5 + abs(fs - 0.4) * 0.5)
    else:
        # No AI classifier — fall back to ELA + frequency only
        combined = ela_score * 0.5 + freq_score * 0.5
        if combined > 0.4:
            verdict = "suspicious"
            confidence = min(0.99, 0.5 + combined * 0.3)
        else:
            verdict = "authentic"
            confidence = min(0.99, 0.6 + (1.0 - combined) * 0.2)

    # Build final explanation
    full_explanation = f'Analysis of "{filename}": ' + " ".join(explanations)

    return verdict, confidence, full_explanation


def _extract_video_frame(video_bytes: bytes):
    """Extract the first frame from a video for analysis."""
    import cv2
    import numpy as np
    import tempfile

    try:
        # Write video to temp file (OpenCV needs a file path)
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            f.write(video_bytes)
            temp_path = f.name

        cap = cv2.VideoCapture(temp_path)

        # Try to get a frame from 1 second in
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(fps))

        ret, frame = cap.read()
        if not ret:
            # Fallback to first frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()

        cap.release()
        os.unlink(temp_path)

        if ret and frame is not None:
            _, buffer = cv2.imencode(".jpg", frame)
            return buffer.tobytes()
    except Exception:
        pass

    return None


def analyze_frequency_from_audio(audio_bytes: bytes):
    """Analyze audio file frequency characteristics."""
    import numpy as np

    try:
        # Simple byte-level audio analysis
        data = np.frombuffer(audio_bytes[:65536], dtype=np.uint8).astype(np.float64)

        if len(data) == 0:
            raise ValueError("Empty audio data")

        # Compute spectral features
        fft = np.fft.fft(data)
        magnitude = np.abs(fft[:len(fft)//2])

        if len(magnitude) == 0:
            raise ValueError("Empty FFT")

        # Normalize
        max_mag = magnitude.max() or 1.0

        # Generate waveform (60 points)
        step = max(1, len(magnitude) // 60)
        waveform = [round(float(magnitude[i * step] / max_mag), 4) for i in range(min(60, len(magnitude) // step))]
        while len(waveform) < 60:
            waveform.append(0.0)

        # Spectral anomaly based on energy distribution
        low = np.mean(magnitude[:len(magnitude)//4])
        high = np.mean(magnitude[len(magnitude)//2:])
        anomaly = min(1.0, high / (low + 1e-8))

        return {
            "spectral_anomaly": round(anomaly, 4),
            "waveform_data": waveform,
            "correlation_data": [{"time": t, "visual": 0.5, "audio": round(waveform[t*2] if t*2 < len(waveform) else 0.0, 4)} for t in range(30)],
        }
    except Exception as e:
        return {
            "spectral_anomaly": 0.0,
            "waveform_data": [0.0] * 60,
            "correlation_data": [{"time": t, "visual": 0.5, "audio": 0.5} for t in range(30)],
            "error": str(e),
        }


if __name__ == "__main__":
    import uvicorn
    print("🛡️  DeepTrust Detection Server v2.0")
    print("   Face Detection: OpenCV Haar Cascade")
    print("   ELA Forensics: Error Level Analysis")
    print("   Frequency: DCT Spectral Analysis")
    print("   AI: Hugging Face ViT Classifier")
    print()
    uvicorn.run(app, host="0.0.0.0", port=8000)
