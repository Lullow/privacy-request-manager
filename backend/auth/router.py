# säkra slumpvärden för auth-token
import secrets
from datetime import datetime, timedelta

# bcrypt — hashar lösenord. Du ger den "lösenord123" och den ger tillbaka en säker hash. Den kan också jämföra ett lösenord mot en hash vid inloggning.
import bcrypt

# get_session behövs för att kunna prata med databasen
from connect_db import get_session
from fastapi import APIRouter, Depends, HTTPException, status

# User är SQLAlchemy-modellen — det är den som representerar user- & token-tabellen i databasen.
from models import Token, User

# schemas är filen schemas.py — och du hämtar fyra Pydantic-klasser därifrån:
from schemas import TokenResponse, UserCreate, UserLogin, UserRead
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .dependencies import get_current_user

# prefix="/auth" — alla endpoints i den här routern får /auth framför sig automatiskt, så det blir /auth/register och /auth/login
# Utan prefix hade du behövt skriva /auth/register manuellt på varje endpoint istället.
# tags=["auth"] — grupperar endpoints under "auth" i Swagger /docs så det ser snyggt och organiserat ut
router = APIRouter(prefix="/auth", tags=["auth"])

# Hjälpfunktion för att skapa en säker(secret) slumpmässig token
def generate_token() -> str:
    return secrets.token_urlsafe(32)

# Med UserRead filtrerar FastAPI automatiskt svaret så att bara id, email och created_at skickas tillbaka — aldrig password_hash.
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
# async def — markerar att funktionen är asynkron, dvs den kan "pausa och vänta" utan att blockera hela servern
# FastAPI ser att parametern har en Pydantic-typ (UserCreate) och förstår automatiskt att den ska läsa och validera JSON-bodyn från requesten och lägga in den där.
# payload innehåller det frontend skickade in — ett UserCreate-objekt med två fält: (payload.email/payload.password)
# Depends(get_session) — FastAPI kör get_session() automatiskt innan funktionen körs
# get_session skapar en databasanslutning och ger den till session
# session är nu ditt verktyg för att prata med databasen — du använder den för att köra queries, spara, hämta osv.

async def register(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    # Kolla om email redan finns
    # select(User) Bygger en SQL-query: SELECT * FROM user
    # .where(User.email == payload.email) Lägger till ett filter: WHERE email = 'namn@gmail.com'
    #  await Väntar på att databasen svarar innan koden fortsätter
    result = await session.execute(select(User).where(User.email == payload.email))

    # scalar_one_or_none() plockar ut ett enda objekt ur råsvaret från databasen.
    # Om email inte finns: existing = None
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hasha lösenordet
    # bcrypt.hashpw(..., ...)Hashar lösenordet + saltet tillsammans. Resultatet är bytes.
    # payload.password = Lösenordet användaren skickade in — t.ex. "mittlösenord123" — som en vanlig sträng.
    # .encode() Gör om strängen till bytes, för bcrypt kan bara jobba med bytes, inte strängar.
    # bcrypt.gensalt() = Genererar ett slumpmässigt "salt" — ett extra brus som läggs till lösenordet innan det hashas. Genererar ett slumpmässigt "salt" — ett extra brus som läggs till lösenordet innan det hashas
    # .decode() Gör om bytes tillbaka till en vanlig sträng, för databasen förväntar sig en sträng.
    # Ta lösenordet → gör om till bytes → lägg till salt → hasha → gör om till sträng → spara i hashed.
    hashed_password = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()

    # Skapar ett nytt User-objekt i Python — men sparar det inte i databasen än.
    # User(...) = skapar ett objekt av din User-modell från models.py
    # email=payload.email = sätter emailen till det frontend skickade in
    # password_hash=hashed = sätter lösenordet till den hashade versionen
    new_user = User(email=payload.email, password_hash=hashed_password)

    # lägg till i sessionen (kö för INSERT)
    session.add(new_user)
    # skicka till databasen (INSERT sker här)
    await session.commit()
    await session.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
# UserLogin är schemat som beskriver vad frontend måste skicka in när man loggar in.
async def login(payload: UserLogin, session: AsyncSession = Depends(get_session)):
    # Hämta användaren
    # .where(User.email == payload.email) WHERE email = "det användaren skickade in"
    # result är råsvaret från databasen — inte ett rent Python-objekt än, utan mer som en behållare med rader. ex: <sqlalchemy.engine.result.ChunkedIteratorResult object>
    result = await session.execute(select(User).where(User.email == payload.email))
    # Därför gör du nästa rad: user = result.scalar_one_or_none()
    # Det ger dig antingen ett rent User-objekt eller None.
    user = result.scalar_one_or_none()

    # Kolla lösenord
    # not user = Ingen användare hittades med den emailen — alltså finns inte kontot.
    # not bcrypt.checkpw(...) Användaren finns men lösenordet är fel
    # payload.password.encode() = lösenordet användaren skickade in (bytes)
    # user.password_hash.encode() = den hashade versionen som sparades i databasen (bytes)
    # bcrypt hashar det inkommande lösenordet och jämför — returnerar True om de matchar, False om inte.
    # or = Om någon av de två är sant → kasta 401-fel.
    # Kastar samma fel oaavsett för att inte signalera om emailen finns i systemet (för hackare)
    if not user or not bcrypt.checkpw(
        payload.password.encode(), user.password_hash.encode()
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    

    token_str = generate_token()

    db_token = Token(
        token=token_str,
        user_id=user.id,
    )

    session.add(db_token)
    await session.commit()

    return{
        "access_token": token_str,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user