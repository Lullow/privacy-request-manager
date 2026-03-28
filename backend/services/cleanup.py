import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import delete, func, or_, select

from connect_db import SessionLocal
from models import Token, User

logger = logging.getLogger(__name__)

INACTIVITY_MONTHS = 24
CLEANUP_INTERVAL_SECONDS = 24 * 60 * 60  # Run once per day.


async def _delete_inactive_users() -> None:
    """Delete accounts that have been inactive for at least 24 months."""
    cutoff = datetime.utcnow() - timedelta(days=INACTIVITY_MONTHS * 30)

    async with SessionLocal() as session:
        # Count first so we can log a meaningful number without a second query.
        count_q = select(func.count()).select_from(User).where(
            or_(
                User.last_login_at < cutoff,
                # Also catch accounts that were never logged into and are old enough.
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
            logger.info("Inactivity cleanup: deleted %d account(s) inactive for > %d months.", count, INACTIVITY_MONTHS)
        else:
            logger.info("Inactivity cleanup: no accounts to delete.")


async def _delete_expired_tokens() -> None:
    """Delete tokens that have passed their expiry date."""
    async with SessionLocal() as session:
        result = await session.execute(
            delete(Token).where(Token.expires_at < datetime.utcnow())
        )
        count = result.rowcount
        await session.commit()
        if count:
            logger.info("Token cleanup: deleted %d expired token(s).", count)


async def cleanup_loop() -> None:
    """Background task that runs cleanup once per day."""
    while True:
        try:
            await _delete_inactive_users()
            await _delete_expired_tokens()
        except Exception:
            logger.exception("Cleanup failed — will retry tomorrow.")
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
