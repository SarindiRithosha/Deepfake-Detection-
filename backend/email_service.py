import requests
import os
from dotenv import load_dotenv
import random
import string

load_dotenv()

class EmailService:
    def __init__(self):
        self.api_key = os.getenv("BREVO_API_KEY")
        self.base_url = "https://api.brevo.com/v3/smtp/email"
        self.headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }
        self.support_email = "verityx.team@gmail.com"
    
    def generate_verification_code(self, length=6):
        """Generate a random verification code"""
        return ''.join(random.choices(string.digits, k=length))
    
    def send_verification_email(self, to_email, code):
        """Send verification email with code"""
        subject = "Verify Your Verity-X Account"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: #013D83; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }}
                .code {{ font-size: 32px; font-weight: bold; color: #013D83; text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; text-align: center; }}
                .info {{ background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Verity-X Email Verification</h2>
                </div>
                
                <p>Hello,</p>
                <p>Thank you for signing up for Verity-X! Your verification code is:</p>
                
                <div class="code">{code}</div>
                
                <div class="info">
                    <strong>Important:</strong> This code will expire in <strong>2 minutes</strong>.
                </div>
                
                <p>Enter this code in the verification page to complete your registration.</p>
                
                <div class="footer">
                    <p>If you didn't create an account with Verity-X, please ignore this email.</p>
                    <p>&copy; 2025 Verity-X. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        payload = {
            "sender": {
                "name": "Verity-X",
                "email": self.support_email
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        
        try:
            response = requests.post(self.base_url, json=payload, headers=self.headers)
            return response.status_code == 201
        except Exception as e:
            print(f"Email sending error: {e}")
            return False
    
    def send_password_reset_email(self, to_email, code):
        """Send password reset email"""
        subject = "Reset Your Verity-X Password"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: #013D83; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }}
                .code {{ font-size: 32px; font-weight: bold; color: #013D83; text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; text-align: center; }}
                .info {{ background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Password Reset Request</h2>
                </div>
                
                <p>Hello,</p>
                <p>You requested to reset your password for Verity-X. Use the following verification code:</p>
                
                <div class="code">{code}</div>
                
                <div class="info">
                    <strong>Important:</strong> This code will expire in <strong>2 minutes</strong>.
                </div>
                
                <p>If you didn't request this password reset, please ignore this email.</p>
                
                <div class="footer">
                    <p>&copy; 2025 Verity-X. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        payload = {
            "sender": {
                "name": "Verity-X",
                "email": self.support_email
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        
        try:
            response = requests.post(self.base_url, json=payload, headers=self.headers)
            return response.status_code == 201
        except Exception as e:
            print(f"Password reset email error: {e}")
            return False

    def send_contact_email(self, contact_data):
        """Send contact form message to support email"""
        subject = f"Contact Form: {contact_data['subject']}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: #013D83; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }}
                .user-info {{ background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .message-content {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 0 0; white-space: pre-wrap; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Contact Form Submission</h2>
                </div>
                
                <div class="user-info">
                    <h3>Contact Information</h3>
                    <p><strong>Name:</strong> {contact_data['userName']}</p>
                    <p><strong>Email:</strong> {contact_data['userEmail']}</p>
                    <p><strong>Subject:</strong> {contact_data['subject']}</p>
                </div>
                
                <div class="message-content">
                    <h3>Message:</h3>
                    <p>{contact_data['message']}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
                </div>
                
                <div class="footer">
                    <p>This message was sent from the Verity-X contact form</p>
                    <p>&copy; 2025 Verity-X. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        payload = {
            "sender": {
                "name": "Verity-X Contact Form",
                "email": self.support_email
            },
            "to": [{"email": self.support_email}],
            "replyTo": {
                "email": contact_data['userEmail'],
                "name": contact_data['userName']
            },
            "subject": subject,
            "htmlContent": html_content
        }
        
        try:
            response = requests.post(self.base_url, json=payload, headers=self.headers)
            return response.status_code == 201
        except Exception as e:
            print(f"Contact email sending error: {e}")
            return False

# Global email service instance
email_service = EmailService()