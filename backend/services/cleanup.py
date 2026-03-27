import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, or_, select

from connect_db import SessionLocal
from models import Token, User

logger = logging.getLogger(__name__)

INACTIVITY_MONTHS = 24
CLEANUP_INTERVAL_SECONDS = 24 * 60 * 60


async def _delete_inactive_users() -> None:
    """Raderar konton som varit inaktiva i minst 24 månader."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=INACTIVITY_MONTHS * 30)

    async with SessionLocal() as session:
        count_q = select(func.count()).select_from(User).where(
            or_(
                User.last_login_at < cutoff,
                (User.last_login_at == None) & (User.created_at < cutoff),
            )
        )
        count = (await session.execute(count_q)).scalar()

        if count:
            await session.execute(
                delete(User).where(
                    or_(
                        User.last_login_at < cutoff,
                        (User.last_login_at == None) & (User.created_at < cutoff),
                    )
                )
            )
            await session.commit()
            logger.info("Inaktivitetsrensning: %d konto(n) raderade (inaktiva > %d månader).", count, INACTIVITY_MONTHS)
        else:
            logger.info("Inaktivitetsrensning: inga konton att radera.")


async def _delete_expired_tokens() -> None:
    """Raderar tokens som passerat sitt expires_at."""
    async with SessionLocal() as session:
        result = await session.execute(
            delete(Token).where(Token.expires_at < datetime.now(timezone.utc))
        )
        count = result.rowcount
        await session.commit()
        if count:
            logger.info("Token-rensning: %d utgångna token(s) raderade.", count)


async def cleanup_loop() -> None:
    """Bakgrundstask som kör rensning en gång per dygn."""
    while True:
        try:
            await _delete_inactive_users()
            await _delete_expired_tokens()
        except Exception:
            logger.exception("Rensning misslyckades — försöker igen imorgon.")
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
