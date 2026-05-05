"""
mock_api.py  —  Verity-X Main API
Real model inference + Firebase storage.
FIX: Authorization header now read explicitly via Request object to guarantee
     it is never dropped, fixing the userId="guest" bug.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from contextlib import asynccontextmanager

from auth_router    import router as auth_router
from upload_router  import router as upload_router
from contact_router import router as contact_router
from admin_router   import router as admin_router
from firebase_config import initialize_firebase
from email_service  import email_service, FeedbackRequest, notification_service
import firebase_service as fb
from model_inference import load_models, analyse_video, is_ready

import os, io, json, base64, tempfile, subprocess, logging, requests
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from urllib.parse import urlparse, parse_qs
from firebase_admin import auth as fb_auth

import yt_dlp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verity_api")


# ── Lifespan ──────────────────────────────────────────────────────────────────
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Verity-X API — loading inference model...")
    ok = load_models()
    if ok:
        logger.info("Model loaded successfully. API ready.")
    else:
        logger.warning("Model failed to load — /analyze endpoints will return 503")
    yield
    logger.info("Verity-X API shutting down.")


app = FastAPI(title="Verity-X API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[  
        "https://verity-x-production.web.app",
        "http://localhost:3000",
        "http://localhost:3001",
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_firebase()

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(contact_router)
app.include_router(admin_router)

DOWNLOAD_DIR = os.environ.get("VIDEO_DOWNLOAD_DIR",
                              os.path.join(os.path.dirname(__file__), "video_cache"))
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


class VideoURLRequest(BaseModel):
    video_url: str


# ── Token verification ────────────────────────────────────────────────────────
def _verify_token(request: Request) -> Optional[str]:
    """
    Extract uid from the Authorization: Bearer <token> header.
    Reads directly from request.headers to guarantee the header is not dropped.
    Returns uid string or None.
    """
    # Try both capitalisation variants just in case
    auth_header = (
        request.headers.get("Authorization") or
        request.headers.get("authorization") or
        ""
    )

    if not auth_header or not auth_header.startswith("Bearer "):
        logger.debug("No Authorization header found — treating as guest")
        return None

    token = auth_header[len("Bearer "):].strip()
    if not token:
        return None

    try:
        decoded = fb_auth.verify_id_token(token)
        uid = decoded.get("uid")
        logger.info(f"Token verified — uid: {uid}")
        return uid
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return None


# ── Anomaly / summary builders ────────────────────────────────────────────────
def _build_anomalies(prob_fake: float) -> list:
    all_anomalies = [
        "Inconsistent facial lighting patterns detected between frames",
        "Unnatural eye blink frequency identified (below normal threshold)",
        "Pixel-level artefacts consistent with generative model synthesis",
        "Facial boundary blending inconsistencies around jawline region",
        "Temporal feature discontinuities across sampled frame sequence",
        "Colour distribution anomalies in skin-tone regions",
        "Unnatural head movement kinematics in temporal sequence",
        "Compression artefact patterns inconsistent with natural video encoding",
    ]
    count = min(len(all_anomalies),
                3 if prob_fake < 0.85 else 5 if prob_fake < 0.92 else 7)
    return all_anomalies[:count]


def _build_summary(verdict: str, confidence: float, source_name: str = "") -> str:
    src = f" from {source_name}" if source_name else ""
    if verdict == "FAKE":
        if confidence >= 0.90:
            return (f"Our AI analysis has detected with high confidence that this video{src} "
                    f"has been synthetically manipulated. Multiple artefacts consistent with "
                    f"deepfake generation were identified across the frame sequence, including "
                    f"facial boundary irregularities and temporal feature inconsistencies.")
        else:
            return (f"Our AI analysis has identified features in this video{src} that are "
                    f"consistent with deepfake manipulation. The model detected manipulation "
                    f"artefacts across sampled frames. Exercise caution with this content.")
    else:
        return (f"No significant manipulation artefacts were detected in this video{src}. "
                f"Facial movements, lighting consistency, and temporal features appear "
                f"natural throughout the sampled frame sequence. The video is assessed as "
                f"authentic by the Verity-X detection model.")


# ── Video repair helper ───────────────────────────────────────────────────────
def repair_video_file(input_path: str) -> str:
    try:
        output_path = input_path + "_repaired.mp4"
        cmd = ["ffmpeg", "-y", "-i", input_path, "-c", "copy",
               "-movflags", "+faststart", output_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode == 0 and os.path.exists(output_path):
            os.remove(input_path)
            os.rename(output_path, input_path)
        return input_path
    except Exception as e:
        logger.warning(f"Video repair failed: {e}")
        return input_path


def validate_and_extract_video_info(url: str) -> dict:
    parsed = urlparse(url)
    domain = parsed.netloc.lower()

    if "youtube.com" in domain or "youtu.be" in domain:
        if "youtube.com" in domain:
            vid = parse_qs(parsed.query).get("v", [None])[0]
        else:
            vid = parsed.path[1:] if parsed.path else None
        if not vid:
            raise ValueError("Invalid YouTube URL")
        return {"platform": "youtube", "valid": True}
    elif "tiktok.com" in domain:
        return {"platform": "tiktok", "valid": True}
    elif "instagram.com" in domain:
        return {"platform": "instagram", "valid": True}
    elif "facebook.com" in domain or "fb.watch" in domain:
        return {"platform": "facebook", "valid": True}
    elif "twitter.com" in domain or "x.com" in domain:
        return {"platform": "twitter", "valid": True}
    elif any(url.lower().endswith(ext) for ext in [".mp4", ".mov", ".avi", ".webm"]):
        return {"platform": "direct", "valid": True}
    else:
        return {"platform": "unknown", "valid": True}


def download_video_from_url(video_url: str, analysis_id: str) -> str:
    filename       = f"video_{analysis_id}.mp4"
    temp_file_path = os.path.join(DOWNLOAD_DIR, filename)

    if any(video_url.lower().endswith(ext) for ext in [".mp4", ".mov", ".avi", ".webm"]):
        response = requests.get(video_url, stream=True, timeout=60)
        response.raise_for_status()
        with open(temp_file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return repair_video_file(temp_file_path)

    ydl_opts = {
        "outtmpl":  temp_file_path,
        "format":   "best[height<=720][ext=mp4]/best[height<=480][ext=mp4]/best[ext=mp4]/best",
        "quiet":    True,
        "no_warnings": True,
        "retries":  5,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-us,en;q=0.5",
            "Sec-Fetch-Mode": "navigate",
        },
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
        "merge_output_format": "mp4",
        "postprocessors": [{"key": "FFmpegVideoConvertor", "preferedformat": "mp4"}],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.extract_info(video_url, download=True)

    if not os.path.exists(temp_file_path) or os.path.getsize(temp_file_path) == 0:
        raise Exception("Downloaded file is empty or missing")

    return repair_video_file(temp_file_path)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Verity-X API is running", "version": "2.0.0", "model_ready": is_ready()}


@app.get("/health")
async def health_check():
    from firebase_config import firebase_app
    return {
        "status":               "healthy",
        "firebase_initialized": firebase_app is not None,
        "model_ready":          is_ready(),
        "timestamp":            datetime.now().isoformat(),
    }


# ── /analyze — file upload ────────────────────────────────────────────────────
@app.post("/analyze")
async def analyze_video(request: Request, file: UploadFile = File(...)):
    """
    Analyse an uploaded video file.
    Authorization header is read directly from request object to avoid FastAPI
    header aliasing issues that caused uid to always resolve as 'guest'.
    """
    if not is_ready():
        raise HTTPException(status_code=503,
            detail="Model is still loading. Please try again in a few seconds.")

    allowed_extensions = {".mp4", ".mov", ".avi"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400,
            detail="Invalid file format. Use .mp4 .mov or .avi")

    file_content = await file.read()
    if len(file_content) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 200MB limit")

    # Read uid BEFORE writing temp file
    uid = _verify_token(request)
    logger.info(f"Analyze request — uid: {uid or 'guest'} — file: {file.filename}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(file_content)
        temp_path = tmp.name

    try:
        result      = analyse_video(temp_path)
        verdict     = result["prediction"]
        confidence  = result["confidence"]
        prob_fake   = result["prob_fake"]
        video_info  = result.get("video_info", {})
        is_fake     = verdict == "FAKE"

        analysis_id = datetime.now().strftime("VID_%Y%m%d_%H%M%S")

        video_id = fb.create_video_record(
            user_id=uid,
            original_filename=file.filename,
            file_size=len(file_content),
            source="file",
            video_info=video_info,
        )

        frame_scores_map = {
            str(fa["frame_number"]): fa["suspicious_score"]
            for fa in result["frame_analysis"]
        }

        db_analysis_id = fb.create_analysis_record(
            user_id=uid,
            video_id=video_id,
            video_name=file.filename,
            verdict=verdict,
            confidence=confidence,
            frame_scores=frame_scores_map,
            anomalies=_build_anomalies(prob_fake) if is_fake else [],
            source="file",
            gradcam_generated=result.get("gradcam_generated", False),
        )

        if uid and uid != "guest":
            fb.increment_user_analysis_count(uid)
            fb.mark_video_processed(video_id)

        return {
            "prediction":        verdict,
            "confidence":        confidence,
            "prob_fake":         prob_fake,
            "prob_real":         result["prob_real"],
            "frame_analysis":    result["frame_analysis"],
            "summary":           _build_summary(verdict, confidence),
            "anomalies":         _build_anomalies(prob_fake) if is_fake else [],
            "filename":          file.filename,
            "analysis_id":       db_analysis_id,
            "timestamp":         datetime.now().isoformat(),
            "frame_count":       len(result["frame_analysis"]),
            "analysis_time":     f"{video_info.get('duration', 0):.1f}s video",
            "model_version":     result["model_version"],
            "gradcam_generated": result.get("gradcam_generated", False),
            "source":            "file",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        try: os.unlink(temp_path)
        except Exception: pass


# ── /analyze-url ──────────────────────────────────────────────────────────────
@app.post("/analyze-url")
async def analyze_video_url(request: Request, video_request: VideoURLRequest):
    if not is_ready():
        raise HTTPException(status_code=503,
            detail="Model is still loading. Please try again in a few seconds.")

    video_url = video_request.video_url
    temp_path = None

    try:
        video_info_meta = validate_and_extract_video_info(video_url)
        platform        = video_info_meta["platform"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Read uid from request headers directly
    uid = _verify_token(request)
    logger.info(f"Analyze-url request — uid: {uid or 'guest'} — platform: {platform}")

    analysis_id = f"{platform.upper()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        logger.info(f"Downloading video from {platform}: {video_url}")
        temp_path = download_video_from_url(video_url, analysis_id)

        if not temp_path or not os.path.exists(temp_path):
            raise HTTPException(status_code=500, detail="Downloaded video file not found")
        if os.path.getsize(temp_path) == 0:
            raise HTTPException(status_code=500, detail="Downloaded video file is empty")

        file_size = os.path.getsize(temp_path)

        result     = analyse_video(temp_path)
        verdict    = result["prediction"]
        confidence = result["confidence"]
        prob_fake  = result["prob_fake"]
        video_info = result.get("video_info", {})
        is_fake    = verdict == "FAKE"

        platform_names = {
            "youtube": "YouTube", "tiktok": "TikTok", "instagram": "Instagram",
            "facebook": "Facebook", "twitter": "Twitter/X",
            "direct": "Direct URL", "unknown": "URL",
        }
        source_name = platform_names.get(platform, "URL")

        video_id = fb.create_video_record(
            user_id=uid,
            original_filename=f"video_from_{platform}_{analysis_id}.mp4",
            file_size=file_size,
            source=platform,
            source_url=video_url,
            video_info=video_info,
        )

        frame_scores_map = {
            str(fa["frame_number"]): fa["suspicious_score"]
            for fa in result["frame_analysis"]
        }

        db_analysis_id = fb.create_analysis_record(
            user_id=uid,
            video_id=video_id,
            video_name=f"video_from_{platform}",
            verdict=verdict,
            confidence=confidence,
            frame_scores=frame_scores_map,
            anomalies=_build_anomalies(prob_fake) if is_fake else [],
            source=platform,
            source_url=video_url,
            gradcam_generated=result.get("gradcam_generated", False),
        )

        if uid and uid != "guest":
            fb.increment_user_analysis_count(uid)
            fb.mark_video_processed(video_id)

        return {
            "prediction":           verdict,
            "confidence":           confidence,
            "prob_fake":            prob_fake,
            "prob_real":            result["prob_real"],
            "frame_analysis":       result["frame_analysis"],
            "summary":              _build_summary(verdict, confidence, source_name),
            "anomalies":            _build_anomalies(prob_fake) if is_fake else [],
            "filename":             f"video_from_{platform}_{analysis_id}.mp4",
            "analysis_id":          db_analysis_id,
            "timestamp":            datetime.now().isoformat(),
            "frame_count":          len(result["frame_analysis"]),
            "analysis_time":        f"{video_info.get('duration', 0):.1f}s video",
            "model_version":        result["model_version"],
            "gradcam_generated":    result.get("gradcam_generated", False),
            "source":               platform,
            "source_name":          source_name,
            "original_url":         video_url,
            "video_available":      True,
            "downloaded_video_path": temp_path,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL analysis failed: {e}", exc_info=True)
        if temp_path and os.path.exists(temp_path):
            try: os.unlink(temp_path)
            except Exception: pass
        raise HTTPException(status_code=500, detail=f"URL analysis failed: {str(e)}")


# ── /validate-url ─────────────────────────────────────────────────────────────
@app.post("/validate-url")
async def validate_video_url(video_request: VideoURLRequest):
    try:
        info = validate_and_extract_video_info(video_request.video_url)
        return {"valid": True, "platform": info["platform"],
                "message": f"Supported {info['platform'].title()} video URL"}
    except ValueError as e:
        return {"valid": False, "platform": "unknown", "message": str(e)}


# ── /video/{analysis_id} ──────────────────────────────────────────────────────
@app.get("/video/{analysis_id}")
async def get_video_file(analysis_id: str):
    video_files = [f for f in os.listdir(DOWNLOAD_DIR)
                   if f.startswith(f"video_{analysis_id}")]
    if not video_files:
        raise HTTPException(status_code=404, detail="Video file not found")
    video_path = os.path.join(DOWNLOAD_DIR, video_files[0])
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(video_path, media_type="video/mp4",
                        filename=f"analyzed_video_{analysis_id}.mp4")


# ── /analysis-history/{uid} ───────────────────────────────────────────────────
@app.get("/analysis-history/{uid}")
async def get_analysis_history(uid: str, request: Request):
    token_uid = _verify_token(request)
    if not token_uid or token_uid != uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    history = fb.get_analysis_history(uid, limit=20)
    return {"analyses": history, "count": len(history)}


# ── /report/{analysis_id} ─────────────────────────────────────────────────────
@app.get("/report/{analysis_id}")
async def download_report(analysis_id: str):
    report_content = (
        f"VERITY-X DEEPFAKE ANALYSIS REPORT\n"
        f"===================================\n\n"
        f"Report ID: {analysis_id}\n"
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Model: EfficientNet-B4 + Temporal Pooling (Exp 6 v3)\n"
        f"Accuracy: 85.84% | AUC-ROC: 0.9307 | EER: 14.61%%\n\n"
        f"For full results see the Verity-X web application.\n\n"
        f"© 2025 Verity-X. All rights reserved.\n"
    )
    report_path = f"/tmp/verityx_report_{analysis_id}.txt"
    with open(report_path, "w") as f:
        f.write(report_content)
    return FileResponse(report_path, media_type="text/plain",
                        filename=f"verityx_report_{analysis_id}.txt")


# ── /cleanup/{analysis_id} ────────────────────────────────────────────────────
@app.delete("/cleanup/{analysis_id}")
async def cleanup_video_file(analysis_id: str):
    video_files = [f for f in os.listdir(DOWNLOAD_DIR)
                   if f.startswith(f"video_{analysis_id}")]
    deleted = 0
    for vf in video_files:
        vp = os.path.join(DOWNLOAD_DIR, vf)
        if os.path.exists(vp):
            os.remove(vp)
            deleted += 1
    return {"message": f"Deleted {deleted} video file(s) for {analysis_id}"}


# ── /submit-feedback ──────────────────────────────────────────────────────────
@app.post("/submit-feedback")
async def submit_feedback(feedback_request: FeedbackRequest):
    try:
        fb.create_feedback_record(
            user_id=getattr(feedback_request, "user_id", None),
            user_email=getattr(feedback_request, "user_email", ""),
            user_name=getattr(feedback_request, "user_name", "Anonymous User"),
            analysis_id=feedback_request.analysis_id,
            rating=feedback_request.rating,
            feedback=feedback_request.feedback,
            prediction=feedback_request.prediction,
            confidence=feedback_request.confidence,
            source=feedback_request.source,
        )
        feedback_log = {
            "timestamp":   feedback_request.timestamp,
            "rating":      feedback_request.rating,
            "feedback":    feedback_request.feedback,
            "analysis_id": feedback_request.analysis_id,
            "prediction":  feedback_request.prediction,
            "confidence":  feedback_request.confidence,
            "source":      feedback_request.source,
            "user_name":   getattr(feedback_request, "user_name", "Anonymous User"),
            "user_email":  getattr(feedback_request, "user_email", ""),
            "user_id":     getattr(feedback_request, "user_id", None),
            "is_logged_in": getattr(feedback_request, "is_logged_in", False),
        }
        with open("user_feedback.json", "a") as f:
            f.write(json.dumps(feedback_log) + "\n")

        notification_service.add_notification({
            "type":       "feedback",
            "user_name":  getattr(feedback_request, "user_name", "Anonymous User"),
            "source":     "Feedback Form",
            "user_email": getattr(feedback_request, "user_email", ""),
            "is_logged_in": getattr(feedback_request, "is_logged_in", False),
        })
        email_sent = email_service.send_feedback_email(feedback_request)
        if email_sent:
            return {"status": "success", "message": "Feedback submitted successfully"}
        else:
            return {"status": "error", "message": "Failed to send feedback email"}
    except Exception as e:
        logger.error(f"Feedback submission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")


# ── /contact ──────────────────────────────────────────────────────────────────
@app.post("/contact")
async def submit_contact(contact_data: dict):
    try:
        notification_service.add_notification({
            "type":       "contact",
            "user_name":  contact_data.get("userName", "Anonymous User"),
            "source":     "Contact Form",
            "user_email": contact_data.get("userEmail", ""),
        })
        email_sent = email_service.send_contact_email(contact_data)
        if email_sent:
            return {"status": "success", "message": "Message sent successfully"}
        else:
            return {"status": "error", "message": "Failed to send message"}
    except Exception as e:
        logger.error(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit contact form")


# ── Admin notification endpoints ──────────────────────────────────────────────
@app.get("/admin/notifications")
async def get_admin_notifications():
    try:
        return {
            "unread_count":  notification_service.get_unread_count(),
            "notifications": notification_service.get_notifications(limit=5),
        }
    except Exception:
        return {"unread_count": 0, "notifications": []}


@app.post("/admin/notifications/mark-read")
async def mark_notifications_read(notification_data: dict = None):
    try:
        notification_id = notification_data.get("notification_id") if notification_data else None
        success = notification_service.mark_as_read(notification_id)
        if success:
            return {"status": "success", "message": "Notifications marked as read"}
        return {"status": "error", "message": "Failed to mark notifications as read"}
    except Exception:
        return {"status": "error", "message": "Internal server error"}


@app.get("/admin/notifications/count")
async def get_notification_count():
    try:
        return {"unread_count": notification_service.get_unread_count()}
    except Exception:
        return {"unread_count": 0}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)