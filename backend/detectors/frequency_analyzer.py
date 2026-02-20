"""
Frequency domain analysis for detecting GAN-generated images.

GAN-generated images have distinctive frequency-domain artifacts:
- Periodic patterns in the DCT spectrum
- Unusual energy distribution across frequencies
- Checkerboard artifacts from upsampling layers

This module performs DCT (Discrete Cosine Transform) analysis to detect these patterns.
"""

import numpy as np
from scipy.fft import dctn
from PIL import Image
import io
from typing import Dict, Any


def analyze_frequency(image_bytes: bytes) -> Dict[str, Any]:
    """
    Perform frequency domain analysis on an image.
    Returns anomaly scores and spectral data.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")

        img_arr = np.array(img, dtype=np.float64)

        # Convert to grayscale for frequency analysis
        gray = np.mean(img_arr, axis=2)

        # Resize to standard size for consistent analysis
        from PIL import Image as PILImage
        gray_img = PILImage.fromarray(gray.astype(np.uint8), mode="L")
        gray_img = gray_img.resize((256, 256), PILImage.Resampling.LANCZOS)
        gray = np.array(gray_img, dtype=np.float64)

        # Compute 2D DCT
        dct_result = dctn(gray, type=2, norm="ortho")

        # Analyze frequency distribution
        magnitude = np.abs(dct_result)

        # Split into low, mid, and high frequency bands
        h, w = magnitude.shape
        low_freq = magnitude[:h // 4, :w // 4]
        mid_freq = magnitude[h // 4:h // 2, w // 4:w // 2]
        high_freq = magnitude[h // 2:, w // 2:]

        low_energy = float(np.mean(low_freq))
        mid_energy = float(np.mean(mid_freq))
        high_energy = float(np.mean(high_freq))

        total_energy = low_energy + mid_energy + high_energy
        if total_energy == 0:
            total_energy = 1.0

        # GAN artifacts tend to produce unusual high-frequency patterns
        high_freq_ratio = high_energy / total_energy

        # Natural images have specific energy decay patterns
        # GAN images deviate from this
        expected_decay = low_energy * 0.1  # Natural images: high freq << low freq
        decay_anomaly = max(0, high_energy - expected_decay) / (low_energy + 1e-8)

        # Check for periodic patterns (checkerboard artifacts from GANs)
        periodicity = _detect_periodicity(magnitude)

        # Overall spectral anomaly score
        spectral_score = min(1.0, (
            high_freq_ratio * 0.3 +
            min(1.0, decay_anomaly * 0.15) * 0.4 +
            periodicity * 0.3
        ))

        # Generate waveform data (spectral energy across frequency bands)
        waveform = _generate_waveform(magnitude)

        # Generate correlation data for cross-modal visualization
        correlation = _generate_spectral_correlation(magnitude)

        return {
            "spectral_anomaly": round(spectral_score, 4),
            "low_freq_energy": round(low_energy, 2),
            "mid_freq_energy": round(mid_energy, 2),
            "high_freq_energy": round(high_energy, 2),
            "high_freq_ratio": round(high_freq_ratio, 4),
            "periodicity_score": round(periodicity, 4),
            "waveform_data": waveform,
            "correlation_data": correlation,
        }

    except Exception as e:
        return {
            "spectral_anomaly": 0.0,
            "low_freq_energy": 0.0,
            "mid_freq_energy": 0.0,
            "high_freq_energy": 0.0,
            "high_freq_ratio": 0.0,
            "periodicity_score": 0.0,
            "waveform_data": [0.0] * 60,
            "correlation_data": [],
            "error": str(e),
        }


def _detect_periodicity(magnitude: np.ndarray) -> float:
    """
    Detect periodic patterns in the frequency domain.
    GANs often produce periodic artifacts due to upsampling layers.
    """
    h, w = magnitude.shape

    # Look at the power spectrum along rows and columns
    row_profile = np.mean(magnitude, axis=0)
    col_profile = np.mean(magnitude, axis=1)

    # Compute autocorrelation to detect periodicity
    row_ac = np.correlate(row_profile - np.mean(row_profile),
                          row_profile - np.mean(row_profile), mode="full")
    row_ac = row_ac[len(row_ac) // 2:]
    if row_ac[0] > 0:
        row_ac /= row_ac[0]

    col_ac = np.correlate(col_profile - np.mean(col_profile),
                          col_profile - np.mean(col_profile), mode="full")
    col_ac = col_ac[len(col_ac) // 2:]
    if col_ac[0] > 0:
        col_ac /= col_ac[0]

    # Look for peaks in autocorrelation (indicates periodicity)
    # Skip the first few samples (trivial correlation)
    row_peaks = np.max(np.abs(row_ac[5:50])) if len(row_ac) > 50 else 0.0
    col_peaks = np.max(np.abs(col_ac[5:50])) if len(col_ac) > 50 else 0.0

    return float(max(row_peaks, col_peaks))


def _generate_waveform(magnitude: np.ndarray) -> list:
    """
    Generate waveform-like data from spectral analysis.
    60 data points representing energy across frequency bands.
    """
    h, w = magnitude.shape
    n_points = 60

    # Average magnitude across radial frequency bands
    center_y, center_x = h // 2, w // 2
    max_radius = min(center_y, center_x)
    band_width = max_radius / n_points

    waveform = []
    for i in range(n_points):
        r_inner = i * band_width
        r_outer = (i + 1) * band_width

        # Create radial mask
        y_coords, x_coords = np.ogrid[:h, :w]
        distances = np.sqrt((y_coords - center_y) ** 2 + (x_coords - center_x) ** 2)
        mask = (distances >= r_inner) & (distances < r_outer)

        if np.any(mask):
            band_energy = float(np.mean(magnitude[mask]))
        else:
            band_energy = 0.0

        # Normalize to 0-1 range
        waveform.append(band_energy)

    # Normalize
    max_val = max(waveform) if max(waveform) > 0 else 1.0
    waveform = [round(v / max_val, 4) for v in waveform]

    return waveform


def _generate_spectral_correlation(magnitude: np.ndarray) -> list:
    """
    Generate correlation data showing visual vs audio-like spectral analysis.
    30 time points with visual and audio energy profiles.
    """
    h, w = magnitude.shape
    n_points = 30

    data = []
    step_h = h // n_points
    step_w = w // n_points

    for t in range(n_points):
        # "Visual" signal: horizontal frequency profile
        row_idx = min(t * step_h, h - 1)
        visual = float(np.mean(magnitude[row_idx, :]))

        # "Audio" signal: vertical frequency profile
        col_idx = min(t * step_w, w - 1)
        audio = float(np.mean(magnitude[:, col_idx]))

        # Normalize
        data.append({
            "time": t,
            "visual": visual,
            "audio": audio,
        })

    # Normalize all values to 0-1
    max_visual = max((d["visual"] for d in data), default=1.0) or 1.0
    max_audio = max((d["audio"] for d in data), default=1.0) or 1.0

    for d in data:
        d["visual"] = round(d["visual"] / max_visual, 4)
        d["audio"] = round(d["audio"] / max_audio, 4)

    return data
