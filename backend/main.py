import asyncio
import logging
from contextlib import asynccontextmanager

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import Connection

from api.routers import router as privacy_request_router
from auth.router import router as auth_router
from connect_db import engine
from limiter import limiter
from services.cleanup import cleanup_loop
from settings import settings

logger = logging.getLogger(__name__)


def _check_migrations(connection: Connection) -> None:
    alembic_cfg = Config("alembic.ini")
    script = ScriptDirectory.from_config(alembic_cfg)
    context = MigrationContext.configure(connection)

    current = set(context.get_current_heads())
    heads = set(script.get_heads())

    if current != heads:
        pending = heads - current
        logger.warning(
            "Databasen har %d ej körda migration(er): %s — kör 'alembic upgrade head'.",
            len(pending),
            ", ".join(pending),
        )
    else:
        logger.info("Databasschemat är uppdaterat.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.connect() as connection:
        await connection.run_sync(_check_migrations)

    task = asyncio.create_task(cleanup_loop())
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
