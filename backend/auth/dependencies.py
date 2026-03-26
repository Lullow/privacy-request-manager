from datetime import datetime

from connect_db import get_session
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models import Token, User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
):
    token_str = credentials.credentials

    result = await session.execute(select(Token).where(Token.token == token_str))
    db_token = result.scalar_one_or_none()

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid token")

    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token har gått ut — logga in igen.")

    result = await session.execute(select(User).where(User.id == db_token.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user