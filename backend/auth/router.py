from datetime import datetime, timedelta

# bcrypt — hashar lösenord. Du ger den "lösenord123" och den ger tillbaka en säker hash. Den kan också jämföra ett lösenord mot en hash vid inloggning.
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status

# python-jose — skapar och verifierar JWT-tokens. En JWT är en krypterad sträng som bevisar att du är inloggad, t.ex. eyJhbGci.... Frontend sparar den och skickar med den i varje request.
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# get_session behövs för att kunna prata med databasen
from connect_db import get_session

# User är SQLAlchemy-modellen — det är den som representerar user-tabellen i databasen.
from models import User

# schemas är filen schemas.py — och du hämtar tre Pydantic-klasser därifrån:
from schemas import UserCreate, UserLogin, UserRead

# SECRET_KEY används för att signera JWT-tokens.
# När du skapar en token vid login
# ligger i .env och settings
from settings import settings

SECRET_KEY = settings.SECRET_KEY

# En JWT (JSON Web Token) är en krypterad sträng som bevisar att du är inloggad.
# Du loggar in → backend skapar en token och skickar den till frontend
# Frontend sparar tokenen (t.ex. i localStorage)
# Vid varje request skickar frontend med tokenen i headern: Authorization: Bearer eyJ...
# Backend verifierar tokenen → vet vem du är → ger dig din data (typ inloggningsbevis)
ALGORITHM = "HS256"

# prefix="/auth" — alla endpoints i den här routern får /auth framför sig automatiskt, så det blir /auth/register och /auth/login
# Utan prefix hade du behövt skriva /auth/register manuellt på varje endpoint istället.
# tags=["Auth"] — grupperar endpoints under "Auth" i Swagger /docs så det ser snyggt och organiserat ut
router = APIRouter(prefix="/auth", tags=["Auth"])


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
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hasha lösenordet
    # bcrypt.hashpw(..., ...)Hashar lösenordet + saltet tillsammans. Resultatet är bytes.
    # payload.password = Lösenordet användaren skickade in — t.ex. "mittlösenord123" — som en vanlig sträng.
    # .encode() Gör om strängen till bytes, för bcrypt kan bara jobba med bytes, inte strängar.
    # bcrypt.gensalt() = Genererar ett slumpmässigt "salt" — ett extra brus som läggs till lösenordet innan det hashas. Genererar ett slumpmässigt "salt" — ett extra brus som läggs till lösenordet innan det hashas
    # .decode() Gör om bytes tillbaka till en vanlig sträng, för databasen förväntar sig en sträng.
    # Ta lösenordet → gör om till bytes → lägg till salt → hasha → gör om till sträng → spara i hashed.
    hashed = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()

    # Skapar ett nytt User-objekt i Python — men sparar det inte i databasen än.
    # User(...) = skapar ett objekt av din User-modell från models.py
    # email=payload.email = sätter emailen till det frontend skickade in
    # password_hash=hashed = sätter lösenordet till den hashade versionen
    new_user = User(email=payload.email, password_hash=hashed)

    # lägg till i sessionen (kö för INSERT)
    session.add(new_user)
    # skicka till databasen (INSERT sker här)
    await session.commit()
    await session.refresh(new_user)

    return new_user


@router.post("/login")
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

    # Skapa JWT-token
    # Du måste skapa tokens för att efter en lyckad inloggning behöver frontend bevis på att användaren är inloggad.
    token = jwt.encode(
        # "sub": str(user.id): sub = subject = vem tokenen tillhör.
        # user.id är ett int (t.ex. 3), men JWT vill ha en sträng, därav str(...) → "3".
        # "exp": datetime.utcnow() + timedelta(hours=24)
        # exp = expiration = när tokenen slutar gälla.
        # datetime.utcnow() = nu
        # timedelta(hours=24) = lägg till 24 timmar
        # Alltså: tokenen är giltig i 24 timmar från att den skapades. Efter det måste användaren logga in igen.
        {"sub": str(user.id), "exp": datetime.utcnow() + timedelta(hours=24)},
        # SECRET_KEY
        # En hemlig sträng som bara servern känner till.
        # JWT använder den för att skriva under tokenen — som en signatur. När frontend skickar tillbaka tokenen kan servern verifiera att den inte har manipulerats, för bara servern känner till nyckeln.
        # Om någon ändrar i tokenen (t.ex. byter user.id från 3 till 1) stämmer signaturen inte längre → servern förkastar den.
        SECRET_KEY,
        # algorithm=ALGORITHM
        # ALGORITHM = "HS256" — den matematiska metoden som används för att skapa signaturen.
        # signaturen.
        # HS256 = HMAC + SHA-256. Du behöver inte förstå detaljerna — det är bara standarden som används för JWT.
        # SECRET_KEY = nyckeln som låser tokenen
        # ALGORITHM = metoden som används för att låsa den
        algorithm=ALGORITHM,
    )
    # "access_token": token. Själva JWT-tokenen — den långa strängen med användarens id och utgångstid.
    # "token_type": "bearer" Berättar för frontend hur tokenen ska användas.
    # Frontend sparar access_token och skickar med den i headern på varje skyddad request. Servern läser den och vet vem du är.
    return {"access_token": token, "token_type": "bearer"}
