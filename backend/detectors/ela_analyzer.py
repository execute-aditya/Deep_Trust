"""
Error Level Analysis (ELA) — a real forensic technique for detecting image manipulation.

How it works:
1. Re-save the image as JPEG at a known quality level
2. Compute the absolute difference between original and re-saved
3. Manipulated regions will have different error levels than the rest

This is used by actual forensic investigators to detect Photoshop edits,
face swaps, and other image tampering.
"""

import io
import numpy as np
from PIL import Image
from typing import Dict, Any


def analyze_ela(image_bytes: bytes, quality: int = 90) -> Dict[str, Any]:
    """
    Perform Error Level Analysis on an image.
    Returns manipulation score and heatmap data.
    """
    try:
        original = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB if needed
        if original.mode != "RGB":
            original = original.convert("RGB")

        width, height = original.size

        # Re-save at known JPEG quality
        buffer = io.BytesIO()
        original.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        resaved = Image.open(buffer)

        # Compute pixel-level difference
        orig_arr = np.array(original, dtype=np.float64)
        resaved_arr = np.array(resaved, dtype=np.float64)

        # Absolute difference
        diff = np.abs(orig_arr - resaved_arr)

        # Scale to 0-255 for visibility
        ela_image = (diff * (255.0 / diff.max())).astype(np.uint8) if diff.max() > 0 else diff.astype(np.uint8)

        # Compute overall manipulation score
        # Higher mean difference = more likely manipulated
        mean_diff = float(np.mean(diff))
        std_diff = float(np.std(diff))
        max_diff = float(np.max(diff))

        # Normalized manipulation score (0 = likely authentic, 1 = likely manipulated)
        # Typical authentic images have low, uniform ELA
        # Manipulated images have high variance in ELA
        variance_score = min(1.0, std_diff / 40.0)  # High std = manipulation
        mean_score = min(1.0, mean_diff / 30.0)  # High mean = recently edited

        manipulation_score = variance_score * 0.6 + mean_score * 0.4

        # Generate heatmap data (8x12 grid matching frontend)
        heatmap = _generate_heatmap_from_ela(ela_image, rows=8, cols=12)

        # Detect regions with anomalous error levels
        artifacts = _detect_artifacts(ela_image, orig_arr)

        return {
            "manipulation_score": round(manipulation_score, 4),
            "mean_difference": round(mean_diff, 2),
            "std_difference": round(std_diff, 2),
            "max_difference": round(max_diff, 2),
            "heatmap_data": heatmap,
            "artifacts": artifacts,
            "image_size": {"width": width, "height": height},
        }

    except Exception as e:
        return {
            "manipulation_score": 0.0,
            "mean_difference": 0.0,
            "std_difference": 0.0,
            "max_difference": 0.0,
            "heatmap_data": [[0.0] * 12 for _ in range(8)],
            "artifacts": [],
            "error": str(e),
        }


def _generate_heatmap_from_ela(
    ela_image: np.ndarray, rows: int = 8, cols: int = 12
) -> list:
    """
    Divide the ELA image into a grid and compute average intensity per cell.
    Returns normalized 0-1 values matching the frontend heatmap format.
    """
    h, w = ela_image.shape[:2]

    # Convert to grayscale if needed
    if len(ela_image.shape) == 3:
        gray = np.mean(ela_image, axis=2)
    else:
        gray = ela_image.astype(np.float64)

    cell_h = h // rows
    cell_w = w // cols

    heatmap = []
    max_val = gray.max() if gray.max() > 0 else 1.0

    for i in range(rows):
        row = []
        for j in range(cols):
            y1 = i * cell_h
            y2 = (i + 1) * cell_h if i < rows - 1 else h
            x1 = j * cell_w
            x2 = (j + 1) * cell_w if j < cols - 1 else w

            cell = gray[y1:y2, x1:x2]
            avg = float(np.mean(cell)) / max_val if cell.size > 0 else 0.0
            row.append(round(avg, 4))
        heatmap.append(row)

    return heatmap


def _detect_artifacts(ela_image: np.ndarray, original: np.ndarray) -> list:
    """
    Detect regions with anomalously high error levels.
    These correspond to potential manipulation artifacts.
    """
    artifacts = []

    if len(ela_image.shape) == 3:
        gray = np.mean(ela_image, axis=2)
    else:
        gray = ela_image.astype(np.float64)

    mean = np.mean(gray)
    std = np.std(gray)

    if std < 1.0:
        return artifacts  # Very uniform, likely authentic

    # Threshold for anomalous regions (2 standard deviations above mean)
    threshold = mean + 2 * std

    h, w = gray.shape

    # Check named facial regions (approximate locations)
    regions = [
        ("Upper face / Forehead", (0, 0, w, h // 3)),
        ("Eye region", (w // 6, h // 6, w * 5 // 6, h // 2)),
        ("Lower face / Jawline", (0, h // 2, w, h)),
        ("Left face boundary", (0, 0, w // 4, h)),
        ("Right face boundary", (w * 3 // 4, 0, w, h)),
    ]

    for name, (x1, y1, x2, y2) in regions:
        region = gray[y1:y2, x1:x2]
        region_mean = float(np.mean(region))

        if region_mean > threshold:
            severity = min(1.0, (region_mean - mean) / (3 * std))
            artifacts.append({
                "region": name,
                "severity": round(severity, 4),
            })

    return artifacts
