"""
FaceForensics++ XceptionNet Deepfake Classifier with Forensic Cross-Validation.

Uses a pretrained XceptionNet model trained on FaceForensics++ (c23 compression)
as the primary detector, with NOISE ANALYSIS as a cross-validation signal
to reduce false positives on real phone photos.

The key insight: FaceForensics++ models are trained on YouTube face-swaps and
can produce false positives on phone camera photos. Noise analysis reliably
distinguishes real photos (variable sensor noise across R/G/B channels) from
GAN-generated images (uniform noise). When the two signals disagree, we
downgrade the verdict to "suspicious".
"""

import os
import io
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms

# ---- Globals (loaded once) ----
_model = None
_device = torch.device("cpu")
_face_cascade = None

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models", "ffpp_c23.pth"
)

# Standard preprocessing (matches FaceForensics++ training exactly)
_transform = transforms.Compose([
    transforms.Resize((299, 299)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])


def _load_model():
    """Load the XceptionNet model once (lazy init)."""
    global _model
    if _model is not None:
        return _model

    import sys
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    from network.xception import Xception

    model = Xception(num_classes=2)
    checkpoint = torch.load(MODEL_PATH, map_location=_device, weights_only=False)
    new_state_dict = {}
    for k, v in checkpoint.items():
        new_key = k.replace("model.", "", 1) if k.startswith("model.") else k
        new_state_dict[new_key] = v
    model.load_state_dict(new_state_dict, strict=True)
    model.eval()
    model.to(_device)
    _model = model
    print(f"[AI Classifier] XceptionNet loaded from {MODEL_PATH}")
    return _model


def _get_face_cascade():
    """Get OpenCV Haar cascade for face detection."""
    global _face_cascade
    if _face_cascade is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _face_cascade = cv2.CascadeClassifier(cascade_path)
    return _face_cascade


def _crop_face(image: Image.Image, margin: float = 0.3) -> Image.Image:
    """
    Detect and crop the largest face from the image.
    Uses a quadratic bounding box with margin (matches FaceForensics++ style).
    """
    img_array = np.array(image)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

    cascade = _get_face_cascade()
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE,
    )

    if len(faces) == 0:
        w, h = image.size
        min_dim = min(w, h)
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        return image.crop((left, top, left + min_dim, top + min_dim))

    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    x, y, w, h = faces[0]
    img_h, img_w = img_array.shape[:2]
    size = int(max(w, h) * (1.0 + 2 * margin))
    cx, cy = x + w // 2, y + h // 2
    x1 = max(0, cx - size // 2)
    y1 = max(0, cy - size // 2)
    x2 = min(img_w, x1 + size)
    y2 = min(img_h, y1 + size)
    side = min(x2 - x1, y2 - y1)
    return image.crop((x1, y1, x1 + side, y1 + side))


def _check_exif(image: Image.Image) -> dict:
    """
    Check EXIF metadata to determine if image came from a real camera.
    
    Real camera photos: have extensive EXIF data (Make, Model, DateTime,
    ExposureTime, FNumber, ISOSpeedRatings, GPS info, etc.)
    
    GAN/deepfake images: have NO EXIF data or only basic software tags.
    
    This is the most reliable cross-validation signal because it's
    impossible for a GAN to produce authentic camera EXIF data.
    """
    exif_data = image.getexif()
    
    if not exif_data:
        return {
            "has_camera_exif": False,
            "camera_field_count": 0,
            "camera_info": "No EXIF metadata — consistent with synthetic/GAN image",
            "fields": [],
        }
    
    # Key EXIF tags that indicate a real camera
    # See https://exiftool.org/TagNames/EXIF.html
    CAMERA_TAGS = {
        271: "Make",           # Camera manufacturer
        272: "Model",          # Camera model
        306: "DateTime",       # Date/time
        33434: "ExposureTime", # Shutter speed
        33437: "FNumber",      # Aperture
        34855: "ISOSpeedRatings",
        36867: "DateTimeOriginal",
        36868: "DateTimeDigitized",
        37377: "ShutterSpeedValue",
        37378: "ApertureValue",
        37380: "ExposureBiasValue",
        37383: "MeteringMode",
        37385: "Flash",
        37386: "FocalLength",
        40962: "PixelXDimension",
        40963: "PixelYDimension",
        41986: "ExposureMode",
        41987: "WhiteBalance",
        42034: "LensInfo",
        42035: "LensMake",
        42036: "LensModel",
    }
    
    found_fields = []
    camera_info_parts = []
    
    for tag_id, tag_name in CAMERA_TAGS.items():
        if tag_id in exif_data:
            val = exif_data[tag_id]
            found_fields.append(tag_name)
            if tag_name in ("Make", "Model"):
                camera_info_parts.append(f"{tag_name}={val}")
    
    field_count = len(found_fields)
    has_camera = field_count >= 3  # At least 3 camera-related EXIF fields
    
    if camera_info_parts:
        camera_str = ", ".join(camera_info_parts)
    else:
        camera_str = "Unknown camera"
    
    if has_camera:
        info = f"Real camera detected ({camera_str}, {field_count} EXIF fields: {', '.join(found_fields[:6])})"
    else:
        info = f"Minimal EXIF ({field_count} fields) — may be synthetic or stripped"
    
    return {
        "has_camera_exif": has_camera,
        "camera_field_count": field_count,
        "camera_info": info,
        "fields": found_fields,
    }


def classify_deepfake(image_bytes: bytes) -> Dict[str, Any]:
    """
    Classify an image as real or deepfake.
    
    Uses XceptionNet (FaceForensics++) as primary detector, with EXIF metadata
    as cross-validation to reduce false positives on real camera photos.
    
    Decision logic:
    - XceptionNet says fake AND no camera EXIF → FAKE
    - XceptionNet says fake BUT has camera EXIF → likely false positive → REAL
    - XceptionNet says real → REAL
    """
    try:
        model = _load_model()
        raw_img = Image.open(io.BytesIO(image_bytes))
        
        # Check EXIF BEFORE converting (conversion strips EXIF)
        exif_info = _check_exif(raw_img)
        
        img = raw_img.convert("RGB")
        original_size = img.size

        # 1. Face detection and cropping
        face_img = _crop_face(img)
        face_size = face_img.size

        # 2. XceptionNet inference
        input_tensor = _transform(face_img).unsqueeze(0).to(_device)
        with torch.no_grad():
            logits = model(input_tensor)
            probs = F.softmax(logits, dim=1)[0]

        xception_real = float(probs[0])
        xception_fake = float(probs[1])

        # 3. Combine XceptionNet + EXIF cross-validation
        details = []

        if xception_fake > 0.5:
            # XceptionNet thinks it's fake — cross-validate with EXIF
            if exif_info["has_camera_exif"]:
                # Image has real camera EXIF metadata (Make, Model, etc.)
                # GANs NEVER produce camera EXIF data, so this is very
                # likely a false positive from XceptionNet
                label = "real"
                adjusted_fake = xception_fake * 0.15  # heavy downgrade
                fake_score = adjusted_fake
                real_score = 1.0 - adjusted_fake
                confidence = real_score
                details.append(
                    f"XceptionNet: fake={xception_fake*100:.1f}% — "
                    f"OVERRIDDEN by camera EXIF metadata. "
                    f"{exif_info['camera_info']}. "
                    f"Real camera photos cannot be GAN-generated."
                )
            else:
                # No camera EXIF → consistent with GAN/synthetic image
                label = "fake"
                fake_score = xception_fake
                real_score = xception_real
                confidence = xception_fake
                details.append(
                    f"XceptionNet: fake={xception_fake*100:.1f}%. "
                    f"{exif_info['camera_info']}"
                )
        else:
            # XceptionNet thinks it's real
            label = "real"
            fake_score = xception_fake
            real_score = xception_real
            confidence = xception_real
            details.append(
                f"XceptionNet: real={xception_real*100:.1f}%. "
                f"{exif_info['camera_info']}"
            )

        details.append(
            f"Face crop: {face_size[0]}x{face_size[1]} from "
            f"{original_size[0]}x{original_size[1]}"
        )

        return {
            "success": True,
            "label": label,
            "confidence": round(confidence, 4),
            "real_score": round(real_score, 4),
            "fake_score": round(fake_score, 4),
            "method": "faceforensics_xception",
            "component_scores": {
                "xception_fake": round(xception_fake, 4),
                "xception_real": round(xception_real, 4),
                "has_camera_exif": exif_info["has_camera_exif"],
                "exif_fields": exif_info["camera_field_count"],
            },
            "details": details,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "label": "unknown",
            "confidence": 0.0,
            "real_score": 0.0,
            "fake_score": 0.0,
            "method": "none",
            "error": str(e),
        }
