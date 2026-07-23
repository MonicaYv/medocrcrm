import pyotp
from asgiref.sync import sync_to_async
from .models import PasswordResetToken
# from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import logging
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import datetime

logger = logging.getLogger(__name__)

def generate_otp_secret() -> str:
    return pyotp.random_base32()

def generate_otp(secret: str, interval: int = 600) -> str:
    return pyotp.TOTP(secret, interval=interval).now()

def verify_otp(secret: str, otp: str, interval: int = 600) -> bool:
    return pyotp.TOTP(secret, interval=interval).verify(otp, valid_window=5)

def _send_email_sync(recipient, subject, text_body, html_body=None):
    from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER

    msg = EmailMultiAlternatives(
        subject,
        text_body,
        from_email,
        [recipient]
    )

    if html_body:
        msg.attach_alternative(html_body, "text/html")

    return msg.send(fail_silently=False) > 0

async def send_email(recipient: str, subject: str, body: str):
    try:
        return await sync_to_async(_send_email_sync)(recipient, subject, body)
    except Exception:
        logger.exception("Failed to send email to %s", recipient)
        return False
    
async def async_send_otp_email(user):
    otp_secret = generate_otp_secret()
    otp = generate_otp(otp_secret)

    print("=" * 50)
    print("EMAIL =", user.email)
    print("OTP =", otp)
    print("=" * 50)

    subject = "Verify your MedOCR Email"

    context = {
        "name": getattr(user, "first_name", "") or "User",
        "otp": list(str(otp)),
        "verify_url": "https://medcrm.aibuzz.net/user/new-otp-verify/",
        "year": datetime.now().year,
    }

    html_body = render_to_string(
        "email/otp_email.html",
        context
    )

    text_body = strip_tags(html_body)

    email_sent = await sync_to_async(_send_email_sync)(
        user.email,
        subject,
        text_body,
        html_body,
    )

    if not email_sent:
        return {
            "success": False,
            "message": "Failed to send email."
        }

    return {
        "success": True,
        "otp_token": otp_secret
    }

async def send_forgot_password_email(user, company_name: str, base_url: str):
    token_obj = await sync_to_async(PasswordResetToken.create_token)(user)
    reset_link = f"{base_url}/user/reset-password/{token_obj.token}/"
    subject = f"Reset your {company_name} password"
    body_text = f"""Hi {user.email},

    We received a request to reset your password for your {company_name} account. 
    If you made this request, click the link below to set a new password:

    {reset_link}

    If you didn’t request a password reset, you can safely ignore this email — your password will remain unchanged.

    Thanks,
    The {company_name} Team

    Security Tip: Never share your password with anyone. This link will expire in 30 minutes for your protection."""

    email_sent = await send_email(user.email, subject, body_text)
    
    if not email_sent:
        return {"success": False, "message": "Failed to send email."}
    print("reset link:", reset_link, "to:", user.email, "company:", company_name)
    return {"success": True, "message": "Password reset email sent."}

