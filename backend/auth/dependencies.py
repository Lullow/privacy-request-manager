from datetime import datetime

from connect_db import get_session
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models import Token, User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

security = HTTPBearer()


async def get_current_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> Token:
    token_str = credentials.credentials

    # joinedload fetches the related User in the same query to avoid an N+1 query.
    result = await session.execute(
        select(Token).where(Token.token == token_str).options(joinedload(Token.user))
    )
    db_token = result.scalar_one_or_none()

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid token")

    # datetime.utcnow() is used here because the DB column is TIMESTAMP WITHOUT TIME ZONE.
    # Comparing a timezone-aware datetime against it would raise a TypeError.
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token has expired — please log in again.")

    return db_token


async def get_current_user(db_token: Token = Depends(get_current_token)) -> User:
    return db_token.user
