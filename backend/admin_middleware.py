from fastapi import HTTPException, Header
from auth_router import admin_sessions
from datetime import datetime

async def verify_admin_token(authorization: str = Header(...)):
    """Middleware to verify admin tokens"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    if token not in admin_sessions:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    
    session_data = admin_sessions[token]
    if datetime.now() > session_data["expires_at"]:
        del admin_sessions[token]
        raise HTTPException(status_code=401, detail="Admin session expired")
    
    return session_data