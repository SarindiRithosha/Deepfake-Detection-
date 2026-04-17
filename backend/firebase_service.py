"""
firebase_service.py
Verity-X — Firestore operations for Video, Analysis, and Feedback collections.
Follows the ERD schema exactly.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional
from firebase_admin import firestore

logger = logging.getLogger("verity_firebase")


def _db():
    """Get Firestore client."""
    return firestore.client()


# ── Video collection ──────────────────────────────────────────────────────────
def create_video_record(
    user_id: Optional[str],
    original_filename: str,
    file_size: int,
    source: str,            # 'file' | 'youtube' | 'tiktok' | etc.
    source_url: str = "",
    video_info: dict = None # {frame_count, fps, duration, width, height}
) -> str:
    """
    Create a Video document in Firestore.
    Returns the generated videoId.
    """
    video_id = str(uuid.uuid4())
    vi = video_info or {}

    doc = {
        "videoId":          video_id,
        "userId":           user_id or "guest",
        "originalFilename": original_filename,
        "storagePath":      "",        # Cloud Storage path — populated on Cloud Run
        "publicUrl":        "",
        "format":           original_filename.rsplit(".", 1)[-1].lower()
                            if "." in original_filename else "mp4",
        "fileSize":         file_size,
        "duration":         vi.get("duration", 0),
        "frameCount":       vi.get("frame_count", 0),
        "width":            vi.get("width", 0),
        "height":           vi.get("height", 0),
        "fps":              vi.get("fps", 0.0),
        "uploadedAt":       firestore.SERVER_TIMESTAMP,
        "source":           source,
        "sourceUrl":        source_url,
        "processed":        False,
    }

    try:
        _db().collection("videos").document(video_id).set(doc)
        logger.info(f"Video record created: {video_id}")
    except Exception as e:
        logger.error(f"Failed to create video record: {e}")

    return video_id


def mark_video_processed(video_id: str):
    """Mark a video as processed after analysis completes."""
    try:
        _db().collection("videos").document(video_id).update({
            "processed": True
        })
    except Exception as e:
        logger.warning(f"Could not mark video processed: {e}")


# ── Analysis collection ───────────────────────────────────────────────────────
def create_analysis_record(
    user_id:        Optional[str],
    video_id:       str,
    video_name:     str,
    verdict:        str,            # 'REAL' | 'FAKE'
    confidence:     float,
    frame_scores:   dict,           # {frame_number: score}
    anomalies:      list,
    source:         str,
    source_url:     str = "",
    gradcam_generated: bool = False,
) -> str:
    """
    Create an Analysis document in Firestore.
    Returns the generated analysisId.
    """
    analysis_id = str(uuid.uuid4())

    doc = {
        "analysisId":      analysis_id,
        "userId":          user_id or "guest",
        "videoId":         video_id,
        "videoName":       video_name,
        "verdict":         verdict,
        "confidenceScore": round(confidence, 4),
        "frameScores":     frame_scores,
        "anomalies":       anomalies,
        "heatmapUrl":      "",   # Populated if stored to Cloud Storage later
        "uploadedAt":      firestore.SERVER_TIMESTAMP,
        "analyzedAt":      firestore.SERVER_TIMESTAMP,
        "status":          "completed",
        "source":          source,
        "sourceUrl":       source_url,
        "gradcamGenerated": gradcam_generated,
    }

    try:
        _db().collection("analyses").document(analysis_id).set(doc)
        logger.info(f"Analysis record created: {analysis_id} | {verdict} | {confidence:.2%}")
    except Exception as e:
        logger.error(f"Failed to create analysis record: {e}")

    return analysis_id


def get_analysis_history(user_id: str, limit: int = 20) -> list:
    """
    Fetch recent analyses for a user.
    Returns list of dicts (serializable — no Firestore timestamps).
    """
    try:
        docs = (
            _db().collection("analyses")
            .where("userId", "==", user_id)
            .order_by("analyzedAt", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        results = []
        for doc in docs:
            data = doc.to_dict()
            # Convert timestamps to ISO strings for JSON serialisation
            for key in ("uploadedAt", "analyzedAt"):
                if key in data and hasattr(data[key], "isoformat"):
                    data[key] = data[key].isoformat()
            results.append(data)
        return results
    except Exception as e:
        logger.error(f"Failed to fetch analysis history: {e}")
        return []


# ── User upload counter ───────────────────────────────────────────────────────
def increment_user_analysis_count(user_id: str):
    """
    Increment analysisCount and update lastAnalysis + lastUpload timestamps
    on the user document.
    """
    if not user_id or user_id == "guest":
        return
    try:
        user_ref = _db().collection("users").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            current = user_doc.to_dict().get("analysis_count", 0)
            user_ref.update({
                "analysis_count": current + 1,
                "last_analysis":  firestore.SERVER_TIMESTAMP,
                "last_upload":    firestore.SERVER_TIMESTAMP,
            })
    except Exception as e:
        logger.warning(f"Could not increment analysis count: {e}")


# ── Feedback collection ───────────────────────────────────────────────────────
def create_feedback_record(
    user_id:     Optional[str],
    user_email:  str,
    user_name:   str,
    analysis_id: str,
    rating:      int,
    feedback:    str,
    prediction:  str,
    confidence:  float,
    source:      str,
) -> str:
    """
    Create a Feedback document in Firestore.
    Returns the generated feedbackId.
    """
    feedback_id = str(uuid.uuid4())

    doc = {
        "feedbackId":  feedback_id,
        "userId":      user_id or "guest",
        "userEmail":   user_email,
        "userName":    user_name,
        "timestamp":   firestore.SERVER_TIMESTAMP,
        "rating":      rating,
        "feedback":    feedback,
        "analysisId":  analysis_id,
        "prediction":  prediction,
        "confidence":  round(confidence, 4),
        "source":      source,
        "type":        "user_feedback",
        "subject":     f"Feedback for analysis {analysis_id}",
        "message":     feedback,
        "read":        False,
    }

    try:
        _db().collection("feedback").document(feedback_id).set(doc)
        logger.info(f"Feedback record created: {feedback_id}")
    except Exception as e:
        logger.error(f"Failed to create feedback record: {e}")

    return feedback_id