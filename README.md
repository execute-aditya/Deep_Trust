# DeepTrust — Advanced Deepfake & AI Manipulation Detector

![DeepTrust Poster](https://github.com/execute-aditya/Deep_Trust/blob/main/Screenshot%20from%202026-02-20%2017-59-47.png)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/AI-PyTorch-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

DeepTrust is a state-of-the-art forensic tool designed to detect GAN-generated faces and deepfake manipulations. It combines **Deep Learning (XceptionNet)** with **Traditional Image Forensics (EXIF Analysis & ELA)** to provide highly accurate verdicts while minimizing false positives on real-world camera photos.

---

## 🚀 The Problem & Our Solution

### The Challenge
Most deepfake detectors struggle with "Out-of-Distribution" data. AI models trained on specific datasets (like YouTube video frames) often produce **false positives** on real phone photos due to modern computational photography artifacts (HDR, multi-frame noise reduction).

### Our Innovation: Hybrid Detection
DeepTrust solves this using a **Hybrid Cross-Validation** pipeline:
1.  **AI Analysis**: A pretrained XceptionNet model (FaceForensics++) identifies neural network artifacts in faces.
2.  **EXIF Forensics**: Real-world camera photos contain rich EXIF metadata (ISO, Exposure, Lens Model, GPS). GAN-generated images lack this data.
3.  **Sanity Check**: If the AI flags an image as "fake" but authentic camera metadata is present, DeepTrust intelligently downgrades the verdict to avoid false positives.

---

## 🛠 Project Architecture
![DeepTrust Architecture](https://github.com/execute-aditya/Deep_Trust/blob/main/Deeptrust%20Architechture.png)

---

## ✨ Key Features

-   **Deep Learning Detection**: Leverages XceptionNet architecture trained on the FaceForensics++ dataset (c23 compression).
-   **EXIF Cross-Validation**: Prevents overconfident AI false positives by verifying physical camera signatures.
-   **Error Level Analysis (ELA)**: Visualizes JPEG compression artifacts to identify localized tampering.
-   **Face-Centric Inference**: Automatic detection and quadratic cropping of faces for optimized neural network input (299x299).
-   **Real-time Dashboard**: Beautifully designed UI with artifact heatmaps, confidence sliders, and technical explanations.

---

## 💻 Tech Stack

-   **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion (Animations), Lucide React (Icons).
-   **Backend**: FastAPI (Python), Uvicorn (Production Server).
-   **Machine Learning**: PyTorch, Torchvision, NumPy.
-   **Computer Vision**: OpenCV (Haar Cascades), Pillow (PIL).

---

## 📥 Installation & Setup

### Prerequisites
-   Node.js 18+
-   Python 3.10+
-   pip & venv

### 1. Clone & Setup Backend
```bash
git clone https://github.com/your-username/DeepTrust.git
cd DeepTrust/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Download Pretrained Weights
Place the `ffpp_c23.pth` model file (XceptionNet weights) in `backend/models/`.

### 3. Setup Frontend
```bash
cd ../  # Back to root
npm install
```

### 4. Run the Application
Start the backend:
```bash
cd backend
python -m uvicorn server:app --port 8000
```
Start the frontend:
```bash
npm run dev -- --port 3000
```
Visit `http://localhost:3000` to start detecting.

---

## 👥 The Team

We are **TEAM SCRATCH**, a dedicated group of developers committed to digital trust and media authenticity.

| Name | Role |
|------|------|
| **SIDDHESH GODAGE** | Lead Developer | 
| **ADIYA DHEMBARE** | Frontend Developer |
| **SUJAL DUBEY** | Research Analyst |
| **AAYUSH GAIKWAD** | Documentation |
| **SATVIK SHETTY** |  Backend Developer |

---

## 🤝 Contribution

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚖️ License & Disclaimer

Distributed under the MIT License. This tool is for **educational and research purposes only**. While highly accurate, no deepfake detector is perfect. Always verify media authenticity from multiple sources.

---
<p align="center">Made with ❤️ for a Safer Internet</p>
