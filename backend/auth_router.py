from fastapi import APIRouter, HTTPException, BackgroundTasks
from firebase_admin import auth, firestore
from firebase_admin.exceptions import FirebaseError
import os
from dotenv import load_dotenv
from models import *
from email_service import email_service
import time
from typing import Dict
import uuid

load_dotenv()

router = APIRouter(prefix="/auth", tags=["authentication"])

# In-memory storage for OTP codes (expires in 2 minutes)
otp_storage: Dict[str, dict] = {}

@router.post("/signup", response_model=dict)
async def signup(user_data: UserCreate, background_tasks: BackgroundTasks):
    """Create a new user account and send OTP"""
    try:
        # Check if email already exists
        try:
            existing_user = auth.get_user_by_email(user_data.email)
            raise HTTPException(status_code=400, detail="Email already registered")
        except FirebaseError:
            # Email doesn't exist, proceed with signup
            pass
        
        # Generate 6-digit OTP
        otp = email_service.generate_verification_code(6)
        otp_id = str(uuid.uuid4())
        
        # Store OTP with user data
        otp_storage[otp_id] = {
            "name": user_data.name,
            "email": user_data.email,
            "password": user_data.password,
            "otp": otp,
            "timestamp": time.time(),
            "type": "signup"
        }
        
        # Send OTP email in background
        email_sent = email_service.send_verification_email(user_data.email, otp)
        
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send verification email")
        
        return {
            "message": "OTP sent to your email. Please verify to complete registration.",
            "otp_id": otp_id,
            "email": user_data.email,
            "expires_in": 120
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/verify-signup-otp", response_model=dict)
async def verify_signup_otp(verification_data: VerificationRequest):
    """Verify OTP for signup and create user account"""
    try:
        # Find OTP data by email
        otp_entry = None
        otp_id = None
        
        for key, data in otp_storage.items():
            if data["email"] == verification_data.email and data["type"] == "signup":
                otp_entry = data
                otp_id = key
                break
        
        if not otp_entry:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Check if OTP is expired (2 minutes)
        if time.time() - otp_entry["timestamp"] > 120:
            del otp_storage[otp_id]
            raise HTTPException(status_code=400, detail="OTP has expired (2 minutes)")
        
        # Verify OTP
        if otp_entry["otp"] != verification_data.code:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        # OTP verified - Create user in Firebase Auth
        user = auth.create_user(
            email=otp_entry["email"],
            password=otp_entry["password"],
            display_name=otp_entry["name"],
            email_verified=True
        )
        
        # Create user document in Firestore
        user_ref = firestore.client().collection("users").document(user.uid)
        user_ref.set({
            "name": otp_entry["name"],
            "email": otp_entry["email"],
            "email_verified": True,
            "created_at": firestore.SERVER_TIMESTAMP,
            "analysis_count": 0,
            "max_uploads": 50
        })
        
        # Clean up OTP
        del otp_storage[otp_id]
        
        return {
            "message": "Email verified successfully. You can now login.",
            "verified": True,
            "email": otp_entry["email"]
        }
        
    except FirebaseError as e:
        error_message = str(e)
        if "email already exists" in error_message.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Account creation failed")
        
@router.post("/forgot-password", response_model=dict)
async def forgot_password(reset_request: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Send password reset OTP"""
    try:
        # Check if user exists with this email
        try:
            user = auth.get_user_by_email(reset_request.email)
        except FirebaseError:
            raise HTTPException(status_code=400, detail="Email not found")
        
        # Generate 6-digit OTP
        otp = email_service.generate_verification_code(6)
        otp_id = str(uuid.uuid4())
        
        # Store OTP for password reset
        otp_storage[otp_id] = {
            "email": reset_request.email,
            "otp": otp,
            "uid": user.uid,
            "timestamp": time.time(),
            "type": "password_reset",
            "verified": False
        }
        
        # Send OTP email
        email_sent = email_service.send_password_reset_email(reset_request.email, otp)
        
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send OTP email")
        
        return {
            "message": "OTP sent to your email",
            "otp_id": otp_id,
            "email": reset_request.email,
            "expires_in": 120
        }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process request")

@router.post("/verify-password-otp", response_model=dict)
async def verify_password_otp(verification_data: VerificationRequest):
    """Verify OTP for password reset"""
    try:
        # Find OTP data by email
        otp_entry = None
        otp_id = None
        
        for key, data in otp_storage.items():
            if data["email"] == verification_data.email and data["type"] == "password_reset":
                otp_entry = data
                otp_id = key
                break
        
        if not otp_entry:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Check if OTP is expired (2 minutes)
        if time.time() - otp_entry["timestamp"] > 120:
            del otp_storage[otp_id]
            raise HTTPException(status_code=400, detail="OTP has expired (2 minutes)")
        
        # Verify OTP
        if otp_entry["otp"] != verification_data.code:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        # Mark OTP as verified
        otp_storage[otp_id]["verified"] = True
        
        return {
            "message": "OTP verified. You can now reset your password.",
            "verified": True,
            "email": verification_data.email
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reset-password", response_model=dict)
async def reset_password(reset_data: PasswordResetConfirm):
    """Reset password with verified OTP"""
    try:
        # Find verified OTP data by email
        otp_entry = None
        otp_id = None
        
        for key, data in otp_storage.items():
            if (data["email"] == reset_data.email and 
                data["type"] == "password_reset" and 
                data.get("verified")):
                otp_entry = data
                otp_id = key
                break
        
        if not otp_entry:
            raise HTTPException(status_code=400, detail="OTP verification required first")
        
        # Check if OTP is still valid (5 minutes total for reset process)
        if time.time() - otp_entry["timestamp"] > 300:
            del otp_storage[otp_id]
            raise HTTPException(status_code=400, detail="Reset process expired")
        
        # Update password in Firebase Auth
        auth.update_user(otp_entry["uid"], password=reset_data.new_password)
        
        # Clean up OTP
        del otp_storage[otp_id]
        
        return {
            "message": "Password reset successfully. You can now login with your new password.",
            "success": True
        }
        
    except FirebaseError as e:
        raise HTTPException(status_code=400, detail="Password reset failed")

@router.post("/resend-otp", response_model=dict)
async def resend_otp(email_data: PasswordResetRequest):
    """Resend OTP for verification"""
    try:
        # Find existing OTP entry
        otp_entry = None
        otp_id = None
        
        for key, data in otp_storage.items():
            if data["email"] == email_data.email:
                otp_entry = data
                otp_id = key
                break
        
        if not otp_entry:
            raise HTTPException(status_code=400, detail="No pending verification found")
        
        # Generate new OTP
        new_otp = email_service.generate_verification_code(6)
        otp_storage[otp_id]["otp"] = new_otp
        otp_storage[otp_id]["timestamp"] = time.time()
        
        # Resend email based on type
        if otp_entry["type"] == "signup":
            email_sent = email_service.send_verification_email(email_data.email, new_otp)
            message = "Signup OTP resent successfully"
        else:
            email_sent = email_service.send_password_reset_email(email_data.email, new_otp)
            message = "Password reset OTP resent successfully"
        
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to resend email")
        
        return {
            "message": message,
            "expires_in": 120
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to resend OTP")

@router.get("/user/{uid}")
async def get_user_profile(uid: str):
    """Get user profile information"""
    try:
        user = auth.get_user(uid)
        user_ref = firestore.client().collection("users").document(uid)
        user_data = user_ref.get()
        
        if user_data.exists:
            profile_data = user_data.to_dict()
            return {
                "uid": uid,
                "name": user.display_name,
                "email": user.email,
                "email_verified": user.email_verified,
                "analysis_count": profile_data.get("analysis_count", 0),
                "max_uploads": profile_data.get("max_uploads", 50),
                "created_at": profile_data.get("created_at")
            }
        else:
            raise HTTPException(status_code=404, detail="User profile not found")
    except FirebaseError as e:
        raise HTTPException(status_code=404, detail="User not found")

