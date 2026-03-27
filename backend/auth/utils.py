import secrets
from datetime import datetime, timedelta, timezone

from models import Token

TOKEN_LIFETIME_DAYS = 30


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def build_auth_token(user_id: int) -> Token:
    return Token(
        token=generate_token(),
        user_id=user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=TOKEN_LIFETIME_DAYS),
    )
