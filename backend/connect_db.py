# Importerar async-varianter av SQLAlchemy-verktyg:
# - AsyncSession: själva "session"-typen för async DB-körning
# - async_sessionmaker: fabrik som skapar sessions
# - create_async_engine: skapar en async "engine" som pratar med databasen
# Importerar dina settings (läser t.ex. DATABASE_URL från .env)
from settings import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Skapar en "engine" = den centrala kopplingen/ingången till databasen.
# Den används för att skapa anslutningar och sessioner.
engine = create_async_engine(
    settings.DATABASE_URL,  # Din DB-url, t.ex. postgresql+asyncpg://...
    echo=False,             # sätt True om du vill se SQL i terminalen
)

# Skapar en "session factory" (en funktion/fabrik) som kan skapa AsyncSession-objekt.
# Varje request i FastAPI kommer oftast få en egen session (så man inte delar state mellan requests).
SessionLoacal = async_sessionmaker(
    bind=engine,                    # Kopplar session-fabriken till vår engine
    expire_on_commit=False,         # Gör att objekt du hämtat inte "tappar data" direkt efter commit (smidigt i API)
    class_=AsyncSession,            # Säger att vi vill ha AsyncSession (inte sync Session)
)

# Detta är en FastAPI "dependency" som vi kommer använda i endpoints.
# Den ger oss en session som automatiskt stängs när requesten är klar.
async def get_session() -> AsyncSession:
    # Skapar en ny session (via vår SessionLocal-fabrik)
    async with SessionLoacal() as session:
        # "yield" = lämna ut sessionen till endpointen (t.ex. i router)
        # När endpointen är klar fortsätter koden efter yield och stänger sessionen automatiskt.
        yield session

