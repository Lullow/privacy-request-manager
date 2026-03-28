from urllib.parse import quote

from services.email_sender import send_email
from settings import settings


async def send_verification_email(email: str, verification_token: str, redirect_to: str | None = None) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    if redirect_to:
        # URL-encode the redirect path so special characters don't break the query string.
        # safe='/' preserves forward slashes so paths like /dashboard remain readable.
        verify_url += f"&next={quote(redirect_to, safe='/')}"

    subject = "Verify your email address - Privacy Request Manager"
    body = f"""Hi,

Thank you for registering with Privacy Request Manager.

Click the link below to verify your email address and activate your account:

{verify_url}

If you did not register, you can safely ignore this email.

Best regards,
Privacy Request Manager"""

    await send_email(to=email, subject=subject, body=body)
