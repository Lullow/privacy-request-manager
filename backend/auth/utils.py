import secrets
from datetime import datetime, timedelta

from models import Token

TOKEN_LIFETIME_DAYS = 30


def generate_token() -> str:
    # secrets.token_urlsafe produces a cryptographically secure random string
    # safe for use in URLs without further encoding.
    return secrets.token_urlsafe(32)


def build_auth_token(user_id: int) -> Token:
    # datetime.utcnow() is intentional — the DB column is TIMESTAMP WITHOUT TIME ZONE,
    # so timezone-aware datetimes would cause a comparison error in dependencies.py.
    return Token(
        token=generate_token(),
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(days=TOKEN_LIFETIME_DAYS),
    )
