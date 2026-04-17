# upload_router.py
from fastapi import APIRouter, HTTPException, Header
from firebase_admin import auth, firestore
from typing import Optional
import time

router = APIRouter(prefix="/uploads", tags=["uploads"])

def verify_token(authorization: str):
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        return None

@router.get("/limit")
async def get_upload_limit(authorization: Optional[str] = Header(None)):
    """Get user upload information. Registered users have NO limit."""
    try:
        if authorization:
            decoded_token = verify_token(authorization)
            if decoded_token:
                uid = decoded_token["uid"]
                user_ref = firestore.client().collection("users").document(uid)
                user_data = user_ref.get()

                if user_data.exists:
                    data = user_data.to_dict()
                    current_count = data.get("analysis_count", 0)
                    return {
                        "max_uploads":  -1,           # -1 = unlimited
                        "current_count": current_count,
                        "remaining":    -1,            # unlimited
                        "can_upload":   True,          # always true for registered
                        "is_registered": True
                    }

        # Unregistered user — limit to 3
        return {
            "max_uploads":  3,
            "current_count": 0,
            "remaining":    3,
            "can_upload":   True,
            "is_registered": False
        }

    except Exception:
        return {
            "max_uploads":  3,
            "current_count": 0,
            "remaining":    3,
            "can_upload":   True,
            "is_registered": False
        }


@router.post("/increment")
async def increment_upload_count(authorization: Optional[str] = Header(None)):
    """Increment analysis count for a registered user."""
    try:
        if not authorization:
            return {"message": "Upload counted for unregistered user"}

        decoded_token = verify_token(authorization)
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid token")

        uid = decoded_token["uid"]
        user_ref = firestore.client().collection("users").document(uid)

        user_doc = user_ref.get()
        if user_doc.exists:
            current_count = user_doc.to_dict().get("analysis_count", 0)
            user_ref.update({
                "analysis_count": current_count + 1,
                "last_analysis":  firestore.SERVER_TIMESTAMP,
                "last_upload":    time.time(),
            })
            return {"message": "Upload count incremented", "current_count": current_count + 1}
        else:
            raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update upload count")


@router.get("/user/{uid}/analytics")
async def get_user_analytics(uid: str, authorization: Optional[str] = Header(None)):
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization required")

        decoded_token = verify_token(authorization)
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid token")

        user_ref  = firestore.client().collection("users").document(uid)
        user_data = user_ref.get()

        if user_data.exists:
            data = user_data.to_dict()
            return {
                "user_id":        uid,
                "name":           data.get("name", "Unknown"),
                "email":          data.get("email", ""),
                "analysis_count": data.get("analysis_count", 0),
                "last_analysis":  data.get("last_analysis"),
                "last_login":     data.get("last_login"),
                "is_online":      data.get("is_online", False),
                "created_at":     data.get("created_at"),
            }
        else:
            raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")