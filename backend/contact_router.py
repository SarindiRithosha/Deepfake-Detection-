from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from email_service import email_service

router = APIRouter(prefix="/contact", tags=["contact"])

class ContactRequest(BaseModel):
    subject: str
    message: str
    userEmail: str
    userName: str

@router.post("/")
async def send_contact_message(contact_data: ContactRequest):
    """Send contact message to support email"""
    try:
        contact_dict = {
            "subject": contact_data.subject,
            "message": contact_data.message,
            "userEmail": contact_data.userEmail,
            "userName": contact_data.userName
        }
        
        email_sent = email_service.send_contact_email(contact_dict)
        
        if email_sent:
            return {
                "status": "success"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        print(f"Error sending contact message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send contact message")

@router.get("/test")
async def test_contact_route():
    """Test endpoint for contact route"""
    return {
        "message": "Contact route is working",
        "status": "success"
    }