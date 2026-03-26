import html
import logging

import resend
from fastapi.concurrency import run_in_threadpool
from settings import settings

logger = logging.getLogger(__name__)


def _build_html_body(body: str) -> str:
    escaped_body = html.escape(body)
    return f"<pre style='font-family: inherit; white-space: pre-wrap;'>{escaped_body}</pre>"


async def send_email(to: str, subject: str, body: str) -> None:
    """Skickar ett mejl via Resend och ger tydliga fel vid fel konfiguration."""
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY saknas i backendens miljövariabler.")

    resend.api_key = settings.RESEND_API_KEY

    params: resend.Emails.SendParams = {
        "from": settings.EMAIL_FROM,
        "to": [to],
        "subject": subject,
        "text": body,
        "html": _build_html_body(body),
    }

    if settings.EMAIL_REPLY_TO:
        params["reply_to"] = settings.EMAIL_REPLY_TO

    try:
        await run_in_threadpool(resend.Emails.send, params)
    except Exception as exc:
        logger.exception("Resend misslyckades för mottagare %s", to)
        raise RuntimeError(f"Resend kunde inte skicka mejlet: {exc}") from exc
