import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import delete, or_

from api.routers import router as privacy_request_router
from auth.router import router as auth_router
from connect_db import SessionLocal
from limiter import limiter
from models import Token, User
from settings import settings

logger = logging.getLogger(__name__)

INACTIVITY_MONTHS = 24
CLEANUP_INTERVAL_SECONDS = 24 * 60 * 60  # körs varje natt


async def _delete_inactive_users() -> None:
    """Raderar konton som varit inaktiva i minst 24 månader."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=INACTIVITY_MONTHS * 30)

    async with SessionLocal() as session:
        # Räkna hur många som berörs innan radering (för loggning)
        from sqlalchemy import select, func
        count_q = select(func.count()).select_from(User).where(
            or_(
                User.last_login_at < cutoff,
                # Konton som aldrig loggat in: använd created_at som fallback
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


async def _cleanup_loop() -> None:
    """Bakgrundstask som kör rensning en gång per dygn."""
    while True:
        try:
            await _delete_inactive_users()
            await _delete_expired_tokens()
        except Exception:
            logger.exception("Rensning misslyckades — försöker igen imorgon.")
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_cleanup_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Privacy Request Manager API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(privacy_request_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
