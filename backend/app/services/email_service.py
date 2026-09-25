import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def _send_email_sync(to_email: str, subject: str, html_body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.PROJECT_NAME} <{settings.EMAIL_FROM}>"
        msg["To"] = to_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        if settings.EMAIL_PORT == 465:
            server = smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT)
        else:
            server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
            server.starttls()

        server.login(settings.EMAIL_USER, settings.EMAIL_PASS)
        server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
        server.quit()
        print(f"📧 Email successfully sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"⚠ Email sending error to {to_email}: {e}")
        return False

async def send_email(to_email: str, subject: str, html_body: str):
    return await asyncio.to_thread(_send_email_sync, to_email, subject, html_body)

async def send_verification_otp_email(to_email: str, first_name: str, otp: str):
    subject = f"Verify Your {settings.PROJECT_NAME} Account"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 10px;">
        <h2 style="color: #38bdf8;">Welcome to {settings.PROJECT_NAME}</h2>
        <p>Hello {first_name},</p>
        <p>Your one-time verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; background: #1e293b; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
            {otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
    """
    return await send_email(to_email, subject, html)

async def send_password_reset_email(to_email: str, otp: str):
    subject = f"Password Reset Request — {settings.PROJECT_NAME}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 10px;">
        <h2 style="color: #38bdf8;">Password Reset Request</h2>
        <p>Your password reset code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f43f5e; background: #1e293b; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
            {otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Valid for 15 minutes. If you did not request a password reset, your account remains secure.</p>
    </div>
    """
    return await send_email(to_email, subject, html)
