import html
import logging
import re

import resend
from fastapi.concurrency import run_in_threadpool
from settings import settings

logger = logging.getLogger(__name__)

_URL_RE = re.compile(r"(https?://\S+)")


def _build_html_body(body: str) -> str:
    # Escape the plain text first to neutralise any HTML special characters,
    # then make URLs clickable. The href value is escaped separately to prevent
    # XSS via malicious URLs embedded in the message body.
    escaped_body = html.escape(body)
    linked_body = _URL_RE.sub(
        lambda m: f'<a href="{html.escape(m.group(1))}">{m.group(1)}</a>',
        escaped_body,
    )
    # pre with white-space: pre-wrap preserves line breaks without a fixed-width font.
    return f"<pre style='font-family: inherit; white-space: pre-wrap;'>{linked_body}</pre>"


async def send_email(to: str, subject: str, body: str) -> None:
    """Send an email via Resend. Raises RuntimeError on misconfiguration or delivery failure."""
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is missing from the environment.")

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
        # Resend's SDK is synchronous, so we run it in a thread pool to avoid
        # blocking the async event loop.
        await run_in_threadpool(resend.Emails.send, params)
    except Exception as exc:
        logger.exception("Resend failed for recipient %s", to)
        raise RuntimeError(f"Resend could not send the email: {exc}") from exc
