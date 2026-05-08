"""
model_inference.py
Verity-X — Real model inference + Grad-CAM
Model: EfficientNet-B4 + Temporal Pooling (Exp 6 v3, continued training)
GCS:   gs://verity-x-models/models/exp6_v3/v1_continued/exp6_v3_continued_v1_torchscript.pt
"""

import os
import io
import cv2
import base64
import logging
import numpy as np
from PIL import Image
from typing import List, Tuple, Optional

import torch
import torch.nn as nn
import torchvision.transforms as T
import timm

logger = logging.getLogger("verity_inference")

# ── Constants 
GCS_PROJECT   = os.environ.get("GCS_PROJECT", "verity-x-deepfake")
MODELS_BUCKET = os.environ.get("GCS_MODELS_BUCKET", "verity-x-models")
TORCHSCRIPT_GCS  = "models/exp6_v3/v1_continued/exp6_v3_continued_v1_torchscript.pt"
PTH_GCS          = "models/exp6_v3/v1_continued/exp6_v3_continued_v1.pth"

LOCAL_MODEL_DIR  = os.path.join(os.path.dirname(__file__), "model_cache")
LOCAL_TS_PATH    = os.path.join(LOCAL_MODEL_DIR, "exp6_v3_torchscript.pt")
LOCAL_PTH_PATH   = os.path.join(LOCAL_MODEL_DIR, "exp6_v3.pth")

FRAMES_PER_VIDEO = 16
FRAME_SIZE       = 224
THRESHOLD        = 0.758          # Exp 6 v3 optimal threshold
IMAGENET_MEAN    = [0.485, 0.456, 0.406]
IMAGENET_STD     = [0.229, 0.224, 0.225]

BACKBONE          = "efficientnet_b4"
BACKBONE_FEATURES = 1792
TEMPORAL_HIDDEN   = 512
DROPOUT           = 0.4

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Model Architecture (for Grad-CAM — needs raw model, not TorchScript) ────
class EfficientNetB4TemporalPooling(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model(
            BACKBONE, pretrained=False, num_classes=0, global_pool="avg")
        self.temporal_head = nn.Sequential(
            nn.Linear(BACKBONE_FEATURES * 2, TEMPORAL_HIDDEN),
            nn.ReLU(inplace=True),
            nn.Dropout(p=DROPOUT),
            nn.Linear(TEMPORAL_HIDDEN, 1),
        )

    def forward(self, x):
        B, T, C, H, W = x.shape
        features = self.backbone(x.view(B * T, C, H, W)).view(B, T, -1)
        pooled   = torch.cat(
            [features.mean(dim=1), features.max(dim=1).values], dim=1)
        return self.temporal_head(pooled).squeeze(1)


# ── Singleton model holders 
_raw_model: Optional[EfficientNetB4TemporalPooling] = None
_ts_model  = None   # TorchScript — for fast inference
_model_loaded = False


def _download_from_gcs(gcs_path: str, local_path: str) -> bool:
    try:
        from google.cloud import storage
        from google.oauth2 import service_account

        # Build credentials from env variables (same as firebase_config.py)
        key_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

        if os.path.exists(key_path):
            # Use JSON file if available
            creds = service_account.Credentials.from_service_account_file(
                key_path,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        else:
            # Build from env variables — matches firebase_config.py fallback
            import json
            service_account_info = {
                "type": "service_account",
                "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
                "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_CERT_URL"),
            }
            creds = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )

        client = storage.Client(project=GCS_PROJECT, credentials=creds)
        bucket = client.bucket(MODELS_BUCKET)
        blob   = bucket.blob(gcs_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        logger.info(f"Downloading {gcs_path} → {local_path}")
        blob.download_to_filename(local_path)
        logger.info(f"Download complete ({os.path.getsize(local_path)/1e6:.1f} MB)")
        return True
    except Exception as e:
        logger.error(f"GCS download failed: {e}")
        return False


def load_models() -> bool:
    """
    Load both the TorchScript model (inference) and the raw model (Grad-CAM).
    Called once at startup via FastAPI lifespan event.
    """
    global _raw_model, _ts_model, _model_loaded

    if _model_loaded:
        return True

    os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)

    # ── 1. Download TorchScript if not cached 
    if not os.path.exists(LOCAL_TS_PATH):
        ok = _download_from_gcs(TORCHSCRIPT_GCS, LOCAL_TS_PATH)
        if not ok:
            logger.error("Could not download TorchScript model — inference disabled")
            return False

    # ── 2. Download raw .pth if not cached (needed for Grad-CAM) 
    if not os.path.exists(LOCAL_PTH_PATH):
        ok = _download_from_gcs(PTH_GCS, LOCAL_PTH_PATH)
        if not ok:
            logger.warning("Could not download .pth — Grad-CAM will be disabled")

    # ── 3. Load TorchScript model 
    try:
        _ts_model = torch.jit.load(LOCAL_TS_PATH, map_location=DEVICE)
        _ts_model.eval()
        logger.info(f"TorchScript model loaded on {DEVICE}")
    except Exception as e:
        logger.error(f"Failed to load TorchScript model: {e}")
        return False

    # ── 4. Load raw model for Grad-CAM 
    if os.path.exists(LOCAL_PTH_PATH):
        try:
            _raw_model = EfficientNetB4TemporalPooling().to(DEVICE)
            ckpt = torch.load(LOCAL_PTH_PATH, map_location=DEVICE, weights_only=False)
            _raw_model.load_state_dict(ckpt["model_state"])
            _raw_model.eval()
            logger.info("Raw model loaded for Grad-CAM")
        except Exception as e:
            logger.warning(f"Raw model load failed (Grad-CAM disabled): {e}")
            _raw_model = None

    _model_loaded = True
    return True


def is_ready() -> bool:
    return _model_loaded and _ts_model is not None


# ── Frame extraction and preprocessing 
def extract_frames(video_path: str,
                   n_frames: int = FRAMES_PER_VIDEO,
                   frame_size: int = FRAME_SIZE) -> Tuple[List[np.ndarray], dict]:
    """
    Extract n_frames uniformly from video_path.
    Returns (frames_rgb, video_info).
    frames_rgb: list of HxWx3 uint8 numpy arrays
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps    = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    dur    = total / fps if fps > 0 else 0

    video_info = {
        "frame_count": total, "fps": round(fps, 2),
        "duration": round(dur, 2), "width": width, "height": height
    }

    if total < 1:
        cap.release()
        raise ValueError("Video has no frames")

    margin = max(1, int(total * 0.05))
    idxs   = [int(margin + i * (total - 2 * margin) / max(1, n_frames - 1))
              for i in range(n_frames)]

    frames = []
    for fi in idxs:
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ret, bgr = cap.read()
        if not ret:
            if frames:
                frames.append(frames[-1].copy())
            continue
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        h, w = rgb.shape[:2]
        s    = min(h, w)
        cy, cx = h // 2, w // 2
        crop = rgb[cy - s // 2:cy + s // 2, cx - s // 2:cx + s // 2]
        if crop.size == 0:
            crop = rgb
        resized = cv2.resize(crop, (frame_size, frame_size),
                             interpolation=cv2.INTER_LANCZOS4)
        frames.append(resized)

    cap.release()

    # Pad if needed
    while len(frames) < n_frames:
        frames.append(frames[-1].copy() if frames else
                      np.zeros((frame_size, frame_size, 3), dtype=np.uint8))

    return frames, video_info


# ── Transform 
_eval_transform = T.Compose([
    T.ToPILImage(),
    T.ToTensor(),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def _frames_to_tensor(frames: List[np.ndarray]) -> torch.Tensor:
    """Convert list of HxWx3 uint8 arrays → [1, T, 3, H, W] float tensor."""
    tensors = [_eval_transform(f) for f in frames]
    return torch.stack(tensors).unsqueeze(0).to(DEVICE)


# ── Inference 
def run_inference(frames: List[np.ndarray]) -> dict:
    """
    Run model inference on extracted frames.
    Returns dict with prediction, confidence, prob_fake, prob_real, threshold.
    """
    if not is_ready():
        raise RuntimeError("Model not loaded — call load_models() first")

    tensor = _frames_to_tensor(frames)

    with torch.no_grad():
        if DEVICE.type == "cuda":
            with torch.cuda.amp.autocast():
                logit = _ts_model(tensor)
        else:
            logit = _ts_model(tensor)
        prob_fake = torch.sigmoid(logit).item()

    label      = "FAKE" if prob_fake >= THRESHOLD else "REAL"
    prob_real  = 1.0 - prob_fake
    confidence = prob_fake if label == "FAKE" else prob_real

    return {
        "prediction":  label,
        "prob_fake":   round(prob_fake, 4),
        "prob_real":   round(prob_real, 4),
        "confidence":  round(confidence, 4),
        "threshold":   THRESHOLD,
    }


# ── Grad-CAM 
class _GradCAMHook:
    """Registers forward/backward hooks on a target layer."""
    def __init__(self, layer: nn.Module):
        self.gradients   = None
        self.activations = None
        self._fwd = layer.register_forward_hook(self._save_activation)
        self._bwd = layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, _, __, output):
        self.activations = output.detach()

    def _save_gradient(self, _, __, grad_output):
        self.gradients = grad_output[0].detach()

    def remove(self):
        self._fwd.remove()
        self._bwd.remove()


def _generate_single_gradcam(model: EfficientNetB4TemporalPooling,
                              frame_tensor: torch.Tensor) -> np.ndarray:
    """
    Generate Grad-CAM heatmap for a single frame [1, 3, H, W].
    Returns HxW float32 array in [0, 1].
    """
    # Target layer: last block of EfficientNet-B4 backbone
    target_layer = model.backbone.blocks[-1]
    hook = _GradCAMHook(target_layer)

    # Forward — treat single frame as [B=1, T=1, C, H, W]
    frame_5d = frame_tensor.unsqueeze(1)   # [1, 1, 3, H, W]
    frame_5d.requires_grad_(False)

    model.zero_grad()
    logit = model(frame_5d)
    score = torch.sigmoid(logit)
    score.backward()

    hook.remove()

    if hook.gradients is None or hook.activations is None:
        return np.zeros((FRAME_SIZE, FRAME_SIZE), dtype=np.float32)

    # Pool gradients over spatial dims → channel weights
    weights = hook.gradients.mean(dim=[2, 3], keepdim=True)   # [B, C, 1, 1]
    cam     = (weights * hook.activations).sum(dim=1)          # [B, H', W']
    cam     = torch.relu(cam).squeeze(0).cpu().numpy()         # [H', W']

    # Normalise
    cam_min, cam_max = cam.min(), cam.max()
    if cam_max > cam_min:
        cam = (cam - cam_min) / (cam_max - cam_min)

    cam = cv2.resize(cam, (FRAME_SIZE, FRAME_SIZE))
    return cam.astype(np.float32)


def _cam_to_heatmap_b64(cam: np.ndarray,
                         original_frame: np.ndarray) -> str:
    """
    Convert a Grad-CAM float array and original frame to a base64 JPEG.
    Returns a data URI string.
    """
    heat = (cam * 255).astype(np.uint8)
    heat_color = cv2.applyColorMap(heat, cv2.COLORMAP_JET)       # BGR
    heat_rgb   = cv2.cvtColor(heat_color, cv2.COLOR_BGR2RGB)

    # Blend heatmap with original frame
    resized_orig = cv2.resize(original_frame, (FRAME_SIZE, FRAME_SIZE))
    blended = cv2.addWeighted(resized_orig, 0.45, heat_rgb, 0.55, 0)

    buf = io.BytesIO()
    Image.fromarray(blended).save(buf, format="JPEG", quality=88)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def generate_gradcam_for_frames(frames: List[np.ndarray]) -> List[Optional[str]]:
    """
    Generate Grad-CAM heatmaps for each frame.
    Returns list of base64 data URIs (or None if Grad-CAM unavailable).
    Only call this when prediction == FAKE.
    """
    if _raw_model is None:
        logger.warning("Raw model not available — returning blank heatmaps")
        return [None] * len(frames)

    heatmaps = []
    _raw_model.eval()

    for frame in frames:
        try:
            frame_t = _eval_transform(frame).unsqueeze(0).to(DEVICE)
            cam     = _generate_single_gradcam(_raw_model, frame_t)
            heatmap_b64 = _cam_to_heatmap_b64(cam, frame)
            heatmaps.append(heatmap_b64)
        except Exception as e:
            logger.warning(f"Grad-CAM failed for frame: {e}")
            heatmaps.append(None)

    return heatmaps


# ── Frame serialisation 
def frame_to_b64(frame: np.ndarray,
                 thumbnail: bool = False,
                 thumb_size: Tuple[int, int] = (300, 200)) -> str:
    """Convert HxWx3 uint8 numpy frame to base64 JPEG data URI."""
    img = Image.fromarray(frame)
    if thumbnail:
        img.thumbnail(thumb_size)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


# ── Per-frame suspicious score 
def score_individual_frames(frames: List[np.ndarray]) -> List[float]:
    """
    Score each frame individually using the TorchScript model.
    Returns a list of prob_fake values per frame.
    Used to populate frame_analysis[i].suspicious_score.
    """
    if not is_ready():
        return [0.5] * len(frames)

    scores = []
    with torch.no_grad():
        for frame in frames:
            t = _eval_transform(frame).unsqueeze(0)
            # Treat single frame as T=1 video
            t5d = t.unsqueeze(1).to(DEVICE)   # [1, 1, 3, H, W]
            if DEVICE.type == "cuda":
                with torch.cuda.amp.autocast():
                    logit = _ts_model(t5d)
            else:
                logit = _ts_model(t5d)
            scores.append(round(torch.sigmoid(logit).item(), 4))
    return scores


# ── Main analysis pipeline 
def analyse_video(video_path: str) -> dict:
    """
    Full pipeline: extract frames → inference → Grad-CAM (FAKE only) →
    per-frame scoring → return structured result dict.

    Returns:
    {
        prediction, confidence, prob_fake, prob_real, threshold,
        frame_analysis: [{frame_number, timestamp, original_frame,
                          heatmap, suspicious_score}, ...],
        video_info: {frame_count, fps, duration, width, height},
        model_version, gradcam_generated
    }
    """
    if not is_ready():
        raise RuntimeError("Model not loaded")

    # 1. Extract frames
    frames, video_info = extract_frames(video_path)

    # 2. Inference
    result = run_inference(frames)
    is_fake = result["prediction"] == "FAKE"

    # 3. Per-frame scores
    frame_scores = score_individual_frames(frames)

    # 4. Grad-CAM — only for FAKE predictions
    heatmaps = []
    if is_fake:
        logger.info("Prediction=FAKE — generating Grad-CAM heatmaps")
        heatmaps = generate_gradcam_for_frames(frames)
    else:
        logger.info("Prediction=REAL — skipping Grad-CAM")
        heatmaps = [None] * len(frames)

    # 5. Build frame analysis list
    fps = video_info["fps"] or 25.0
    total_frames = video_info["frame_count"]
    margin = max(1, int(total_frames * 0.05))
    frame_indices = [
        int(margin + i * (total_frames - 2 * margin) / max(1, FRAMES_PER_VIDEO - 1))
        for i in range(len(frames))
    ]

    frame_analysis = []
    for i, (frame, score, heatmap, fi) in enumerate(
            zip(frames, frame_scores, heatmaps, frame_indices)):

        secs = fi / fps
        ts   = f"{int(secs // 60)}:{int(secs % 60):02d}"

        orig_b64 = frame_to_b64(frame, thumbnail=True)

        # If FAKE and Grad-CAM generated use it; else blank
        if is_fake and heatmap is not None:
            heatmap_b64 = heatmap
        else:
            # Blank black image for REAL or failed Grad-CAM
            blank = np.zeros((FRAME_SIZE, FRAME_SIZE, 3), dtype=np.uint8)
            heatmap_b64 = frame_to_b64(blank, thumbnail=True)

        frame_analysis.append({
            "frame_number":    fi,
            "timestamp":       ts,
            "original_frame":  orig_b64,
            "heatmap":         heatmap_b64,
            "suspicious_score": score,
        })

    result.update({
        "frame_analysis":    frame_analysis,
        "video_info":        video_info,
        "model_version":     "EfficientNetB4-TemporalPooling-Exp6v3",
        "gradcam_generated": is_fake,
        "frames_analysed":   len(frames),
    })

    return result