"""
Email notification system.
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
import os
from ..core.config import settings

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@operatorskillshub.com")
        self.from_name = os.getenv("FROM_NAME", "Operator Skills Hub")
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email notification."""
        if not self.smtp_username or not self.smtp_password:
            print("Email configuration not set, skipping email notification")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Add text content
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.from_email, to_email, message.as_string())
            
            print(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_notification_email(
        self,
        to_email: str,
        notification_type: str,
        title: str,
        content: str,
        course_title: Optional[str] = None,
        action_url: Optional[str] = None
    ) -> bool:
        """Send a formatted notification email."""
        
        # Create HTML content
        html_content = self._create_notification_html(
            title, content, course_title, action_url, notification_type
        )
        
        # Create text content
        text_content = self._create_notification_text(
            title, content, course_title, action_url, notification_type
        )
        
        return self.send_email(to_email, title, html_content, text_content)
    
    def _create_notification_html(
        self,
        title: str,
        content: str,
        course_title: Optional[str],
        action_url: Optional[str],
        notification_type: str
    ) -> str:
        """Create HTML content for notification email."""
        
        # Get notification icon and color based on type
        icon_map = {
            "message": {"icon": "💬", "color": "#3B82F6"},
            "qa_reply": {"icon": "💡", "color": "#10B981"},
            "course_update": {"icon": "📚", "color": "#F59E0B"},
            "test_result": {"icon": "📊", "color": "#8B5CF6"},
            "system": {"icon": "🔔", "color": "#6B7280"}
        }
        
        notification_info = icon_map.get(notification_type, icon_map["system"])
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, {notification_info['color']}, #1E40AF); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">
                    {notification_info['icon']} {title}
                </h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p style="font-size: 16px; margin-bottom: 20px;">{content}</p>
                    
                    {f'<p style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid {notification_info["color"]}; margin: 20px 0;">' if course_title else ''}
                    {f'<strong>Course:</strong> {course_title}' if course_title else ''}
                    {f'</p>' if course_title else ''}
                    
                    {f'<div style="text-align: center; margin: 30px 0;">' if action_url else ''}
                    {f'<a href="{action_url}" style="background: {notification_info["color"]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Details</a>' if action_url else ''}
                    {f'</div>' if action_url else ''}
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    <p style="font-size: 14px; color: #6B7280; text-align: center;">
                        This is an automated notification from Operator Skills Hub.<br>
                        You can manage your notification preferences in your account settings.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_notification_text(
        self,
        title: str,
        content: str,
        course_title: Optional[str],
        action_url: Optional[str],
        notification_type: str
    ) -> str:
        """Create text content for notification email."""
        
        text = f"{title}\n\n{content}\n\n"
        
        if course_title:
            text += f"Course: {course_title}\n\n"
        
        if action_url:
            text += f"View Details: {action_url}\n\n"
        
        text += "This is an automated notification from Operator Skills Hub.\n"
        text += "You can manage your notification preferences in your account settings."
        
        return text

# Global email service instance
email_service = EmailService()









