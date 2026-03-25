import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from settings import settings


def _send_sync(to: str, subject: str, body: str) -> None:
    """Synkron SMTP-sändning — körs i en thread-executor för att inte blockera event loop."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        raise RuntimeError("SMTP är inte konfigurerat. Sätt SMTP_HOST, SMTP_USER och SMTP_PASSWORD i .env.")

    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], to, msg.as_string())


async def send_email(to: str, subject: str, body: str) -> None:
    """Skickar ett mejl asynkront via SMTP."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_sync, to, subject, body)
