import os
import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("secureauth.mail")

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 465))
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@secureauth-x.com")

is_configured = bool(EMAIL_USER and EMAIL_PASS and EMAIL_HOST)

def _send_sync(to_email: str, subject: str, html_body: str):
    if not is_configured:
        logger.info(f"[Mock Mail] To: {to_email} | Subject: {subject}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"SecureAuth X <{EMAIL_FROM}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        clean_pass = EMAIL_PASS.strip().replace(" ", "")

        if EMAIL_PORT == 465:
            server = smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT)
        else:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            server.starttls()

        server.login(EMAIL_USER.strip(), clean_pass)
        server.sendmail(EMAIL_FROM, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"SMTP delivery error to {to_email}: {e}")
        return False

async def send_mail_async(to_email: str, subject: str, html_body: str):
    return await asyncio.to_thread(_send_sync, to_email, subject, html_body)
