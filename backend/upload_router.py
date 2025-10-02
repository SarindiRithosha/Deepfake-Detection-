# upload_router.py
from fastapi import APIRouter, HTTPException, Header
from firebase_admin import auth, firestore
from typing import Optional
import time
from datetime import datetime

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
                    max_uploads = data.get("max_uploads", 50)  # Changed from 250 to 50 to match your requirement
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
    """Increment user's upload count and track analysis timestamp"""
    try:
        if not authorization:
            # Unregistered user - handle via frontend local storage
            return {"message": "Upload counted for unregistered user"}
        
        decoded_token = verify_token(authorization)
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = decoded_token["uid"]
        user_ref = firestore.client().collection("users").document(uid)
        
        # Get current user data first
        user_doc = user_ref.get()
        if user_doc.exists:
            current_data = user_doc.to_dict()
            current_count = current_data.get("analysis_count", 0)
            
            # Update with increment and timestamp
            updates = {
                "analysis_count": current_count + 1,
                "last_analysis": firestore.SERVER_TIMESTAMP,
                "last_upload": time.time()
            }
            
            user_ref.update(updates)
            
            return {
                "message": "Upload count incremented", 
                "current_count": current_count + 1
            }
        else:
            raise HTTPException(status_code=404, detail="User not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update upload count")

@router.get("/user/{uid}/analytics")
async def get_user_analytics(uid: str, authorization: Optional[str] = Header(None)):
    """Get user analytics for admin panel"""
    try:
        # Verify admin token (you might want to add proper admin verification)
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization required")
        
        decoded_token = verify_token(authorization)
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_ref = firestore.client().collection("users").document(uid)
        user_data = user_ref.get()
        
        if user_data.exists:
            data = user_data.to_dict()
            return {
                "user_id": uid,
                "name": data.get("name", "Unknown"),
                "email": data.get("email", ""),
                "analysis_count": data.get("analysis_count", 0),
                "last_analysis": data.get("last_analysis"),
                "last_login": data.get("last_login"),
                "is_online": data.get("is_online", False),
                "created_at": data.get("created_at")
            }
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user analytics: {str(e)}")