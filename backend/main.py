# Huvudramverket som skapar API-app
# Importerar APIRouter från routers.py
# as privacy_request_router är en tydlig alias så man fattar vad routern innehåller
from fastapi import FastAPI

# Gör att frontend (React) får göra requests till backend från en annan origin (t.ex. localhost:5173 -> loocalhost:8000)
from fastapi.middleware.cors import CORSMiddleware

from api.routers import router as privacy_request_router
from auth.router import router as auth_router

# Importerar settings-instansen (läser från .env via pydantic-settings)
from settings import settings

# Skapa själva FastAPI-applikationen:
# title syns i Swagger UI (/docs)
app = FastAPI(title="Privacy Request Manager API")


# Kopplar på CORS:
# .add_middleware() = lägg till ett filter på appen.
# allow_origins = vilka origins som får anropa API (t.ex. React dev server)
# allow_credentials = om vi vill tillåta cookies/credentials (kan vara bra senare)
# allow_methods/allow_headers = "*" = tillåt alla (enkelt för MVP)
app.add_middleware(
    CORSMiddleware,
    # allow_origins = vilka adresser får anropa API:t.
    allow_origins=settings.cors_origins_list,  # Gör om string -> list i settings.py
    # allow_credentials = Tillåt att cookies/tokens skickas med requests. Behövs om du lägger till inloggning senare.
    allow_credentials=True,
    # "*" = tillåt alla HTTP-metoder — GET, POST, PUT, DELETE osv.
    allow_methods=["*"],
    # "*" = tillåt alla headers. T.ex. Authorization, Content-Type osv.
    allow_headers=["*"],
)


# Kopplar in router i appen:
# prefix="/api" betyder att endpoints blir:
# -/api/privacy-requests
# -/api/privacy-requests/{id}
app.include_router(privacy_request_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


# En enkel "health check" endpoint:
# För att se om servern är igång
@app.get("/health")
async def health():
    # Returnera i JSON-format:
    return {"status": "ok"}
