import secrets
from datetime import datetime, timedelta

import bcrypt

from connect_db import get_session
from fastapi import APIRouter, Depends, HTTPException, status

from models import Token, User
from schemas import TokenResponse, UserCreate, UserLogin, UserRead
from services.email_sender import send_email
from settings import settings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def generate_token() -> str:
    return secrets.token_urlsafe(32)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

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

    # Bygg verifieringslänken — inkludera redirect_to om frontend skickade med det
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    if payload.redirect_to:
        verify_url += f"&next={payload.redirect_to}"

    # Skicka verifieringsmejl
    subject = "Verifiera din e-postadress – Privacy Request Manager"
    body = f"""Hej,

Tack för att du registrerade dig hos Privacy Request Manager.

Klicka på länken nedan för att verifiera din e-postadress och aktivera ditt konto:

{verify_url}

Länken är giltig tills vidare. Om du inte registrerade dig kan du ignorera detta mejl.

Med vänliga hälsningar,
Privacy Request Manager"""

    try:
        await send_email(to=payload.email, subject=subject, body=body)
    except Exception:
        # Om mejlet misslyckas tar vi inte bort kontot — användaren kan kontakta support
        pass

    return {"message": "Konto skapat. Kontrollera din e-post för att verifiera ditt konto."}


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

    token_str = generate_token()
    db_token = Token(token=token_str, user_id=user.id)
    session.add(db_token)
    await session.commit()

    return {"access_token": token_str, "token_type": "bearer"}


@router.get("/verify-email", response_model=TokenResponse)
async def verify_email(token: str, session: AsyncSession = Depends(get_session)):
    # Hitta användaren med detta verifieringstoken
    result = await session.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=400, detail="Ogiltig eller redan använd verifieringslänk.")

    # Markera som verifierad och rensa token
    user.is_verified = True
    user.verification_token = None

    # Skapa ett auth-token så att användaren loggas in direkt
    auth_token = generate_token()
    db_token = Token(token=auth_token, user_id=user.id)
    session.add(db_token)
    await session.commit()

    return {"access_token": auth_token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
