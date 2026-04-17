"""
firebase_service.py
Verity-X — Firestore operations for Video, Analysis, and Feedback collections.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional
from firebase_admin import firestore

logger = logging.getLogger("verity_firebase")


def _db():
    return firestore.client()


# ── Video collection ──────────────────────────────────────────────────────────
def create_video_record(
    user_id: Optional[str],
    original_filename: str,
    file_size: int,
    source: str,
    source_url: str = "",
    video_info: dict = None
) -> str:
    video_id = str(uuid.uuid4())
    vi = video_info or {}

    doc = {
        "videoId":          video_id,
        "userId":           user_id or "guest",
        "originalFilename": original_filename,
        "storagePath":      "",
        "publicUrl":        "",
        "format":           original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "mp4",
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
        logger.info(f"Video record created: {video_id} for user: {user_id or 'guest'}")
    except Exception as e:
        logger.error(f"Failed to create video record: {e}")

    return video_id


def mark_video_processed(video_id: str):
    try:
        _db().collection("videos").document(video_id).update({"processed": True})
    except Exception as e:
        logger.warning(f"Could not mark video processed: {e}")


# ── Analysis collection ───────────────────────────────────────────────────────
def create_analysis_record(
    user_id:           Optional[str],
    video_id:          str,
    video_name:        str,
    verdict:           str,
    confidence:        float,
    frame_scores:      dict,
    anomalies:         list,
    source:            str,
    source_url:        str = "",
    gradcam_generated: bool = False,
) -> str:
    analysis_id = str(uuid.uuid4())

    doc = {
        "analysisId":       analysis_id,
        "userId":           user_id or "guest",
        "videoId":          video_id,
        "videoName":        video_name,
        "verdict":          verdict,
        "confidenceScore":  round(confidence, 4),
        "frameScores":      frame_scores,
        "anomalies":        anomalies,
        "heatmapUrl":       "",
        "uploadedAt":       firestore.SERVER_TIMESTAMP,
        "analyzedAt":       firestore.SERVER_TIMESTAMP,
        # Also store as plain ISO string for easy sorting without index
        "analyzedAtStr":    datetime.now().isoformat(),
        "status":           "completed",
        "source":           source,
        "sourceUrl":        source_url,
        "gradcamGenerated": gradcam_generated,
    }

    try:
        _db().collection("analyses").document(analysis_id).set(doc)
        logger.info(f"Analysis record created: {analysis_id} | user: {user_id or 'guest'} | {verdict} | {confidence:.2%}")
    except Exception as e:
        logger.error(f"Failed to create analysis record: {e}")

    return analysis_id


def get_analysis_history(user_id: str, limit: int = 20) -> list:
    """
    Fetch analyses for a user.
    Uses simple where() filter WITHOUT order_by to avoid needing a Firestore composite index.
    Sorts in Python instead.
    """
    try:
        docs = (
            _db().collection("analyses")
            .where("userId", "==", user_id)
            .limit(50)   # fetch more then sort+slice in Python
            .stream()
        )

        results = []
        for doc in docs:
            data = doc.to_dict()
            # Convert Firestore timestamps to ISO strings for JSON serialisation
            for key in ("uploadedAt", "analyzedAt"):
                if key in data and hasattr(data[key], "isoformat"):
                    data[key] = data[key].isoformat()
                elif key in data and hasattr(data[key], "timestamp"):
                    # Firestore DatetimeWithNanoseconds
                    try:
                        data[key] = data[key].isoformat()
                    except Exception:
                        data[key] = str(data[key])
            results.append(data)

        # Sort by analyzedAtStr (ISO string sorts correctly) descending
        results.sort(key=lambda x: x.get("analyzedAtStr", ""), reverse=True)

        return results[:limit]

    except Exception as e:
        logger.error(f"Failed to fetch analysis history for {user_id}: {e}")
        return []


# ── User upload counter ───────────────────────────────────────────────────────
def increment_user_analysis_count(user_id: str):
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
            logger.info(f"Incremented analysis count for {user_id}: {current + 1}")
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