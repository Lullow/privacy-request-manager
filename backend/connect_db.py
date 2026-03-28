from settings import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# The engine manages the connection pool and knows how to talk to the database.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True to print all SQL statements to stdout (useful for debugging).
)

# Session factory: calling SessionLocal() produces a new AsyncSession bound to the engine.
# expire_on_commit=False keeps ORM objects usable after a commit without re-querying.
SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_session() -> AsyncSession:
    # FastAPI dependency that yields one session per request and closes it automatically.
    async with SessionLocal() as session:
        yield session
