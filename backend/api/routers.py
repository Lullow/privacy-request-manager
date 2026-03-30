import re

from auth.dependencies import get_current_user
from connect_db import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from limiter import limiter
from models import Message, PrivacyRequest, User
from schemas import (
    GenerateMessageRequest,
    GenerateMessageResponse,
    MessageRead,
    PrivacyRequestCreate,
    PrivacyRequestRead,
    PrivacyRequestUpdate,
    SendRequestBody,
)
from services.ai_generator import generate_gdpr_message, generate_legal_gdpr_message
from services.email_sender import send_email
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/privacy-requests", tags=["Privacy Requests"])


@router.post("", response_model=PrivacyRequestRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_privacy_request(
    request: Request,
    payload: PrivacyRequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    new_row = PrivacyRequest(
        company_name=payload.company_name,
        company_email=str(payload.company_email),
        full_name=payload.full_name,
        city=payload.city,
        birth_date=payload.birth_date,
        # HttpUrl must be cast to str before storing — SQLAlchemy expects a plain string.
        profile_url=str(payload.profile_url) if payload.profile_url else None,
        tone=payload.tone,
        status="draft",
        user_id=current_user.id,
    )
    session.add(new_row)
    await session.commit()
    await session.refresh(new_row)
    return new_row


@router.get("", response_model=list[PrivacyRequestRead])
async def list_privacy_requests(
    session: AsyncSession = Depends(get_session),
    status: str | None = None,
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(PrivacyRequest)
        .where(PrivacyRequest.user_id == current_user.id)
        .order_by(PrivacyRequest.id.desc())
    )
    if status:
        stmt = stmt.where(PrivacyRequest.status == status)

    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{request_id}", response_model=PrivacyRequestRead)
async def get_privacy_request(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    row = (await session.execute(stmt)).scalar_one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")
    return row


@router.put("/{request_id}", response_model=PrivacyRequestRead)
async def update_privacy_request(
    request_id: int,
    payload: PrivacyRequestUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    row = (await session.execute(stmt)).scalar_one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    row.status = payload.status
    await session.commit()
    await session.refresh(row)
    return row


@router.delete("/{request_id}")
async def delete_privacy_request(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    row = (await session.execute(stmt)).scalar_one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    await session.delete(row)
    await session.commit()
    return {"message": "Privacy request deleted"}


@router.post("/{request_id}/generate", response_model=GenerateMessageResponse)
async def generate_request_message(
    request_id: int,
    payload: GenerateMessageRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    request_row = (await session.execute(stmt)).scalar_one_or_none()

    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    # Prefer the birth_date from the payload so the user can override the stored value.
    birth_date = payload.birth_date or request_row.birth_date

    if payload.use_legal_template:
        generated = generate_legal_gdpr_message(
            company_name=request_row.company_name,
            full_name=request_row.full_name,
            personal_number=payload.personal_number or "",
            birth_date=birth_date,
            address=payload.legal_address,
            phone=payload.legal_phone,
            registrant_email=payload.legal_email,
        )
    else:
        generated = generate_gdpr_message(
            company_name=request_row.company_name,
            company_email=request_row.company_email,
            full_name=request_row.full_name,
            city=request_row.city,
            profile_url=request_row.profile_url,
            birth_date=birth_date,
            tone=payload.tone,
            message_type=payload.message_type,
            request_types=payload.request_types,
        )

    new_message = Message(
        privacy_request_id=request_row.id,
        message_type=payload.message_type,
        source="ai",
        subject=generated["subject"],
        message_body=generated["message_body"],
        tone=payload.tone,
    )
    session.add(new_message)

    request_row.tone = payload.tone
    request_row.status = "generated"

    await session.commit()
    await session.refresh(new_message)

    return GenerateMessageResponse(
        subject=new_message.subject,
        message_body=new_message.message_body,
        message_type=new_message.message_type,
        tone=new_message.tone,
    )


@router.get("/{request_id}/messages", response_model=list[MessageRead])
async def list_request_messages(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership before listing messages.
    stmt_request = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    request_row = (await session.execute(stmt_request)).scalar_one_or_none()

    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    stmt_messages = (
        select(Message)
        .where(Message.privacy_request_id == request_id)
        .order_by(Message.id.desc())
    )
    rows = (await session.execute(stmt_messages)).scalars().all()
    return list(rows)


@router.post("/{request_id}/send")
@limiter.limit("3/5minute")
async def send_privacy_request(
    request_id: int,
    request: Request,
    payload: SendRequestBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    request_row = (await session.execute(stmt)).scalar_one_or_none()

    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    # Fetch the most recently generated message for this request.
    stmt_msg = (
        select(Message)
        .where(Message.privacy_request_id == request_id)
        .order_by(Message.id.desc())
    )
    message = (await session.execute(stmt_msg)).scalars().first()

    if message is None:
        raise HTTPException(status_code=400, detail="No generated message found for this request")

    body = message.message_body
    # Substitute the personal number placeholder at send time so it is never stored in the DB.
    if payload.personal_number and "[PERSONNUMMER]" in body:
        # Validate format before substitution to prevent injection via malformed values.
        if not re.fullmatch(r"\d{6,8}-?\d{4}", payload.personal_number):
            raise HTTPException(status_code=400, detail="Invalid personal number format.")
        body = body.replace("[PERSONNUMMER]", payload.personal_number)

    try:
        await send_email(to=request_row.company_email, subject=message.subject, body=body)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not send email. Please try again later.")

    request_row.status = "sent"
    await session.commit()

    return {"message": "Email sent"}


@router.post("/{request_id}/reminder")
@limiter.limit("1/10minute")
async def send_reminder(
    request_id: int,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    request_row = (await session.execute(stmt)).scalar_one_or_none()

    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    generated = generate_gdpr_message(
        company_name=request_row.company_name,
        company_email=request_row.company_email,
        full_name=request_row.full_name,
        city=request_row.city,
        profile_url=request_row.profile_url,
        birth_date=request_row.birth_date,
        tone=request_row.tone,
        message_type="follow_up",
        request_types=["delete"],
    )

    new_message = Message(
        privacy_request_id=request_row.id,
        message_type="follow_up",
        source="ai",
        subject=generated["subject"],
        message_body=generated["message_body"],
        tone=request_row.tone,
    )
    session.add(new_message)

    try:
        await send_email(
            to=request_row.company_email,
            subject=generated["subject"],
            body=generated["message_body"],
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not send reminder. Please try again later.")

    request_row.status = "waiting"
    await session.commit()

    return {"message": "Reminder sent"}
