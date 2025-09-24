import requests
import os
from dotenv import load_dotenv
import random
import string

load_dotenv()

class EmailService:
    def __init__(self):
        # IMPORTANT: Ensure BREVO_API_KEY is correctly set in your .env file
        self.api_key = os.getenv("BREVO_API_KEY")
        self.base_url = "https://api.brevo.com/v3/smtp/email"
        self.headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }
    
    def generate_verification_code(self, length=6):
        """Generate a random verification code"""
        return ''.join(random.choices(string.digits, k=length))
    
    def send_verification_email(self, to_email, code):
        """
        Send verification email with code.
        NOTE: The sender email 'verityx.team@gmail.com' MUST be
        a verified sender in your Brevo account.
        """
        # Check if the API key was loaded successfully
        if not self.api_key:
            print("Error: BREVO_API_KEY not found. Please check your .env file.")
            return False

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
                "email": "verityx.team@gmail.com"
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        
        try:
            response = requests.post(self.base_url, json=payload, headers=self.headers)
            # Print response details for debugging
            print(f"Brevo API Response Status: {response.status_code}")
            print(f"Brevo API Response Body: {response.text}")
            return response.status_code == 201
        except Exception as e:
            print(f"Email sending error: {e}")
            return False
    
    def send_password_reset_email(self, to_email, code):
        """
        Send password reset email.
        NOTE: The sender email must be a verified sender in your Brevo account.
        """
        # Check if the API key was loaded successfully
        if not self.api_key:
            print("Error: BREVO_API_KEY not found. Please check your .env file.")
            return False
            
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
                "email": "verityx.team@gmail.com"
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        
        try:
            response = requests.post(self.base_url, json=payload, headers=self.headers)
            # Print response details for debugging
            print(f"Brevo API Response Status: {response.status_code}")
            print(f"Brevo API Response Body: {response.text}")
            return response.status_code == 201
        except Exception as e:
            print(f"Password reset email error: {e}")
            return False

# Global email service instance
email_service = EmailService()
