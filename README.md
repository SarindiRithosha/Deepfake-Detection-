# Verity-X — AI-Powered Deepfake Detection Web Application

## Overview

Verity-X is a full-stack web application that enables users to submit video content and receive an AI-powered verdict on whether the footage has been synthetically manipulated (deepfake). The system provides frame-level evidence, Grad-CAM heatmap visualisations, and a downloadable PDF forensic report, making detection outputs both interpretable and documentable for non-technical users.

---

## Live Application

| Service | URL |
|---|---|
| Frontend (Firebase Hosting) | https://verity-x-production.web.app |
| Backend API (Cloud Run) | https://verity-x-backend-714385254365.europe-west2.run.app |
| API Documentation | https://verity-x-backend-714385254365.europe-west2.run.app/docs |

---

## Features

- **Video Analysis** — Upload MP4/MOV/AVI files (up to 200MB) or submit direct video URLs
- **AI Detection** — EfficientNet-B4 + Temporal Mean-Max Pooling architecture
- **Frame Analysis** — 16 uniformly sampled frames with per-frame suspicious scores
- **Grad-CAM Explainability** — Heatmap overlays highlighting regions that influenced the prediction
- **PDF Report** — Downloadable forensic report with verdict, metrics, and frame analysis
- **User Authentication** — Firebase Authentication with email verification
- **Analysis History** — Registered users can view all past analyses
- **Admin Dashboard** — Real-time statistics, user management, and feedback monitoring
- **Guest Access** — Up to 3 analyses without registration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, React Router v6, Axios, jsPDF |
| Backend | Python 3.13, FastAPI, Uvicorn |
| AI Model | PyTorch 2.6.0, EfficientNet-B4 (timm), TorchScript |
| Authentication | Firebase Authentication (JWT) |
| Database | Google Cloud Firestore |
| Storage | Google Cloud Storage |
| Deployment - Backend | Google Cloud Run (europe-west2) |
| Deployment - Frontend | Firebase Hosting |
| Email | Brevo API |

---

## AI Model

The production model is **Experiment 6 v3** — EfficientNet-B4 with temporal mean-max pooling, trained on a domain-consistent subset of the DFDC dataset.

| Metric | Value |
|---|---|
| Accuracy | 85.84% |
| AUC-ROC | 0.9307 |
| Macro F1-Score | 0.8584 |
| Equal Error Rate (EER) | 14.61% |
| Classification Threshold | 0.758 |
| Test Set Size | 438 videos |

---

## Known Limitations

- **YouTube URL analysis** is unavailable on the deployed backend. YouTube's anti-bot detection blocks download requests from Google Cloud Run IP addresses. The feature works correctly in local development. Use file upload for YouTube content.
- **Multi-person scenes** produce elevated false positive rates - the model is optimised for single-subject, face-forward footage consistent with the DFDC training distribution.
- **Generative AI avatars** (HeyGen, similar tools) are not reliably detected as this manipulation category is not represented in the DFDC training data.
- **Cold start latency** — first request after idle period takes 30–60 seconds while Cloud Run initialises the container and loads the model.

---

## Datasets

| Dataset | Source | Usage |
|---|---|---|
| DeepFake Detection Challenge (DFDC) | [Kaggle](https://www.kaggle.com/competitions/deepfake-detection-challenge) | Primary training and test set |
| Celeb-DF v2 | [Official repo](https://github.com/yuezunli/celeb-deepfakeforensics) | Cross-dataset generalisation experiments |

---

## Academic Context

This project was submitted in partial fulfilment of the requirements for the degree of BSc (Hons) Software Engineering at Plymouth University (PUSL3190 Computing Project, 2025–2026).

**Key finding:** The distributional consistency of manipulated (FAKE) training data exerts greater influence on detection performance than raw dataset volume. Mixing FAKE samples from different distributions induces negative transfer and reduces classification accuracy.

---

## License

This project was developed for academic purposes. All datasets used are publicly available research benchmarks used solely for non-commercial academic research.
