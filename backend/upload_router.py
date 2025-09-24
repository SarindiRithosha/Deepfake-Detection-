from fastapi import APIRouter, HTTPException, Header
from firebase_admin import auth, firestore
from typing import Optional
import time

router = APIRouter(prefix="/uploads", tags=["uploads"])

def verify_token(authorization: str):
    """Verify Firebase ID token"""
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        return None

@router.get("/limit")
async def get_upload_limit(authorization: Optional[str] = Header(None)):
    """Get user's upload limit information"""
    try:
        if authorization:
            decoded_token = verify_token(authorization)
            if decoded_token:
                uid = decoded_token["uid"]
                user_ref = firestore.client().collection("users").document(uid)
                user_data = user_ref.get()
                
                if user_data.exists:
                    data = user_data.to_dict()
                    max_uploads = data.get("max_uploads", 250)
                    current_count = data.get("analysis_count", 0)
                    return {
                        "max_uploads": max_uploads,
                        "current_count": current_count,
                        "remaining": max_uploads - current_count,
                        "can_upload": current_count < max_uploads,
                        "is_registered": True
                    }
        
        # Unregistered user or invalid token
        unregistered_count = 0  
        return {
            "max_uploads": 3,
            "current_count": unregistered_count,
            "remaining": 3 - unregistered_count,
            "can_upload": unregistered_count < 3,
            "is_registered": False
        }
        
    except Exception as e:
        return {
            "max_uploads": 3,
            "current_count": 0,
            "remaining": 3,
            "can_upload": True,
            "is_registered": False
        }

@router.post("/increment")
async def increment_upload_count(authorization: Optional[str] = Header(None)):
    """Increment user's upload count"""
    try:
        if not authorization:
            # Unregistered user - handle via frontend local storage
            return {"message": "Upload counted for unregistered user"}
        
        decoded_token = verify_token(authorization)
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = decoded_token["uid"]
        user_ref = firestore.client().collection("users").document(uid)
        
        user_ref.update({
            "analysis_count": firestore.Increment(1),
            "last_upload": time.time()
        })
        
        return {"message": "Upload count incremented"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update upload count")