import logging
import secrets
from datetime import datetime, timedelta

import bcrypt

TOKEN_LIFETIME_DAYS = 30

from connect_db import get_session
from fastapi import APIRouter, Depends, HTTPException, status

from models import Token, User
from schemas import ResendVerificationRequest, TokenResponse, UserCreate, UserLogin, UserRead
from services.email_sender import send_email
from settings import settings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def build_auth_token(user_id: int) -> Token:
    return Token(
        token=generate_token(),
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(days=TOKEN_LIFETIME_DAYS),
    )


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


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")

        existing_user.verification_token = generate_token()
        await session.commit()

        try:
            await send_verification_email(
                email=existing_user.email,
                verification_token=existing_user.verification_token,
                redirect_to=payload.redirect_to,
            )
        except Exception as exc:
            logger.exception("Verifieringsmejl kunde inte skickas till %s", existing_user.email)
            return {
                "message": (
                    "Kontot finns redan men är inte verifierat. "
                    "Verifieringsmejlet kunde inte skickas igen."
                ),
                "email_sent": False,
                "error": str(exc),
            }

        return {
            "message": "Kontot finns redan men är inte verifierat. Ett nytt verifieringsmejl har skickats.",
            "email_sent": True,
        }

    hashed_password = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()
    verification_token = generate_token()

    new_user = User(
        email=payload.email,
        password_hash=hashed_password,
        is_verified=False,
        verification_token=verification_token,
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    try:
        await send_verification_email(
            email=payload.email,
            verification_token=verification_token,
            redirect_to=payload.redirect_to,
        )
    except Exception as exc:
        logger.exception("Verifieringsmejl kunde inte skickas till %s", payload.email)
        return {
            "message": (
                "Konto skapat, men verifieringsmejlet kunde inte skickas. "
                "Kontrollera Resend-konfigurationen och försök igen."
            ),
            "email_sent": False,
            "error": str(exc),
        }

    return {
        "message": "Konto skapat. Kontrollera din e-post för att verifiera ditt konto.",
        "email_sent": True,
    }


@router.post("/resend-verification")
async def resend_verification(
    payload: ResendVerificationRequest, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None:
        return {
            "message": "Om kontot finns och inte redan är verifierat har ett verifieringsmejl skickats.",
            "email_sent": True,
        }

    if user.is_verified:
        return {
            "message": "Kontot är redan verifierat. Du kan logga in direkt.",
            "email_sent": False,
        }

    user.verification_token = generate_token()
    await session.commit()

    try:
        await send_verification_email(
            email=user.email,
            verification_token=user.verification_token,
            redirect_to=payload.redirect_to,
        )
    except Exception as exc:
        logger.exception("Verifieringsmejl kunde inte skickas till %s", user.email)
        return {
            "message": "Kontot finns men verifieringsmejlet kunde inte skickas.",
            "email_sent": False,
            "error": str(exc),
        }

    return {
        "message": "Verifieringsmejl skickat. Kontrollera din inkorg.",
        "email_sent": True,
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not bcrypt.checkpw(payload.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Verifiera din e-postadress först. Kontrollera din inkorg.",
        )

    user.last_login_at = datetime.utcnow()

    db_token = build_auth_token(user.id)
    session.add(db_token)
    await session.commit()

    return {"access_token": db_token.token, "token_type": "bearer"}


@router.get("/verify-email", response_model=TokenResponse)
async def verify_email(token: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=400, detail="Ogiltig eller redan använd verifieringslänk.")

    user.is_verified = True
    user.verification_token = None

    db_token = build_auth_token(user.id)
    session.add(db_token)
    await session.commit()

    return {"access_token": db_token.token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/account", status_code=204)
async def delete_account(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user = await session.get(User, current_user.id)
    await session.delete(user)
    await session.commit()
