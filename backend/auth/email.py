from services.email_sender import send_email
from settings import settings


async def send_verification_email(email: str, verification_token: str, redirect_to: str | None = None) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    if redirect_to:
        verify_url += f"&next={redirect_to}"

    subject = "Verifiera din e-postadress - Privacy Request Manager"
    body = f"""Hej,

Tack för att du registrerade dig hos Privacy Request Manager.

Klicka på länken nedan för att verifiera din e-postadress och aktivera ditt konto:

{verify_url}

Länken är giltig tills vidare. Om du inte registrerade dig kan du ignorera detta mejl.

Med vänliga hälsningar,
Privacy Request Manager"""

    await send_email(to=email, subject=subject, body=body)
