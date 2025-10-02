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
import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import Query

load_dotenv()

router = APIRouter(prefix="/auth", tags=["authentication"])

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

        user_id = user.uid 
        
        # Create user document in Firestore
        user_ref = firestore.client().collection("users").document(user.uid)
        user_ref.set({
            "user_id": user_id,
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
            "email": otp_entry["email"],
            "name": otp_entry["name"],
            "user_id": user_id

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
            
            user_ref.update({
                'last_login': firestore.SERVER_TIMESTAMP,
                'is_online': True
            })
            
            return {
                "uid": uid,
                "name": user.display_name,
                "email": user.email,
                "email_verified": user.email_verified,
                "analysis_count": profile_data.get("analysis_count", 0),
                "max_uploads": profile_data.get("max_uploads", 50),
                "created_at": profile_data.get("created_at"),
                "last_login": firestore.SERVER_TIMESTAMP,  
                "is_online": True
            }
        else:
            raise HTTPException(status_code=404, detail="User profile not found")
    except FirebaseError as e:
        raise HTTPException(status_code=404, detail="User not found")
    
@router.put("/user/{uid}")
async def update_user_profile(uid: str, user_update: dict):
    """Update user profile information"""
    try:
        # Verify the user is updating their own profile
        # (You might want to add proper authentication here)
        
        user_ref = firestore.client().collection("users").document(uid)
        
        update_data = {}
        if 'name' in user_update:
            update_data['name'] = user_update['name']
            # Also update display name in Firebase Auth
            try:
                auth.update_user(uid, display_name=user_update['name'])
            except Exception as e:
                print(f"Error updating auth display name: {e}")
        
        if update_data:
            user_ref.update(update_data)
        
        return {"message": "Profile updated successfully", "updated_fields": list(update_data.keys())}
        
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.delete("/user/{uid}")
async def delete_user_account(uid: str):
    """Delete user account permanently"""
    try:
        # Delete from Firebase Auth
        auth.delete_user(uid)
        
        # Delete from Firestore
        user_ref = firestore.client().collection("users").document(uid)
        user_ref.delete()
        
        return {"message": "Account deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting user account: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete account")
    
ADMIN_CREDENTIALS = {
    os.getenv("ADMIN_EMAIL"): {
        "password_hash": hashlib.sha256(os.getenv("ADMIN_PASSWORD").encode()).hexdigest(),
        "name": os.getenv("ADMIN_NAME"),
        "role": "super_admin"
    }
}

admin_sessions = {}

@router.post("/admin-login", response_model=dict)
async def admin_login(login_data: UserLogin):
    """Admin login with separate authentication"""
    try:
        # Check if email exists in admin credentials
        if login_data.email not in ADMIN_CREDENTIALS:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        admin_info = ADMIN_CREDENTIALS[login_data.email]
        
        # Verify password
        password_hash = hashlib.sha256(login_data.password.encode()).hexdigest()
        if password_hash != admin_info["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        # Create admin session token
        session_token = secrets.token_hex(32)
        admin_sessions[session_token] = {
            "email": login_data.email,
            "name": admin_info["name"],
            "role": admin_info["role"],
            "login_time": datetime.now(),
            "expires_at": datetime.now() + timedelta(hours=24)
        }
        
        return {
            "message": "Admin login successful",
            "token": session_token,
            "admin": {
                "email": login_data.email,
                "name": admin_info["name"],
                "role": admin_info["role"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Admin login failed")

@router.post("/admin-logout", response_model=dict)
async def admin_logout(token: str):
    """Admin logout"""
    if token in admin_sessions:
        del admin_sessions[token]
    return {"message": "Admin logged out successfully"}

@router.get("/admin/verify")
async def verify_admin_token(token: str = Query(...)):  
    """Verify admin token"""
    if token not in admin_sessions:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    
    session_data = admin_sessions[token]
    if datetime.now() > session_data["expires_at"]:
        del admin_sessions[token]
        raise HTTPException(status_code=401, detail="Admin session expired")
    
    return {
        "valid": True,
        "admin": {
            "email": session_data["email"],
            "name": session_data["name"],
            "role": session_data["role"]
        }
    }

