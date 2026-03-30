import logging

from auth.dependencies import get_current_user
from connect_db import get_session
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from models import InboundMessage, PrivacyRequest, User
from schemas import InboundMessageRead
from settings import settings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from svix.webhooks import Webhook, WebhookVerificationError

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Webhooks"])


@router.post("/webhooks/inbound-email", status_code=status.HTTP_200_OK)
async def inbound_email_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
    svix_id: str | None = Header(default=None, alias="svix-id"),
    svix_timestamp: str | None = Header(default=None, alias="svix-timestamp"),
    svix_signature: str | None = Header(default=None, alias="svix-signature"),
):
    """Receive inbound email events from Resend and store them in the database."""
    raw_body = await request.body()

    # Verify webhook signature if a secret is configured.
    if settings.RESEND_WEBHOOK_SECRET:
        wh = Webhook(settings.RESEND_WEBHOOK_SECRET)
        headers = {
            "svix-id": svix_id or "",
            "svix-timestamp": svix_timestamp or "",
            "svix-signature": svix_signature or "",
        }
        try:
            wh.verify(raw_body, headers)
        except WebhookVerificationError:
            logger.warning("Inbound webhook: invalid signature — request rejected")
            raise HTTPException(status_code=401, detail="Invalid webhook signature.")

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    # Resend wraps the event in a type/data envelope.
    event_type = data.get("type", "")
    if event_type != "email.received":
        # Acknowledge other event types silently — we only care about inbound mail.
        return {"received": True}

    email_data = data.get("data", {})
    from_email = email_data.get("from", "")
    subject = email_data.get("subject", "(no subject)")
    body = email_data.get("text") or email_data.get("html") or ""

    if not from_email:
        raise HTTPException(status_code=400, detail="Missing 'from' field in webhook payload.")

    # Try to match to a PrivacyRequest by comparing the sender's domain/email.
    privacy_request_id: int | None = None
    stmt = select(PrivacyRequest).where(PrivacyRequest.company_email == from_email)
    match = (await session.execute(stmt)).scalars().first()
    if match:
        privacy_request_id = match.id

    inbound = InboundMessage(
        privacy_request_id=privacy_request_id,
        from_email=from_email,
        subject=subject,
        body=body,
    )
    session.add(inbound)
    await session.commit()

    logger.info(
        "Inbound email received from %s — matched to privacy_request_id=%s",
        from_email,
        privacy_request_id,
    )
    return {"received": True}


@router.get(
    "/privacy-requests/{request_id}/inbound-messages",
    response_model=list[InboundMessageRead],
)
async def list_inbound_messages(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Return all inbound replies for a given privacy request."""
    # Verify ownership.
    stmt_req = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    if (await session.execute(stmt_req)).scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    stmt = (
        select(InboundMessage)
        .where(InboundMessage.privacy_request_id == request_id)
        .order_by(InboundMessage.received_at.asc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)
