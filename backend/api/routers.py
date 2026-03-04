# - APIRouter: gör en "mini-app" med routes (endpoints) som du kan koppla in i main.py
# - Depends: dependency injection (t.ex. hämta DB-session automatiskt)
# - HTTPException: kasta ett kontrollerat fel (t.ex. 404) som API:t returnerar som JSON
# - status: färdiga HTTP-statuskoder (201, 404 osv)
from fastapi import APIRouter, Depends, HTTPException, status

# - select: bygger en SELECT-query (typ "SELECT * FROM privacy_request")
from sqlalchemy import select

# AsyncSession: själva DB-sessionen som används när vi kör async mot databasen
from sqlalchemy.ext.asyncio import AsyncSession

# get_session: vår egen dependency som skapar/stänger DB-session per request
from connect_db import get_session

# PrivacyRequest: SQLAlchemy-modellen (tabellen) vi sparar/läser i DB
from models import PrivacyRequest

# - PrivacyRequestCreate: datan vi förväntar oss från frontend när man skapar
# - PrivacyRequestRead: datan vi skickar tillbaka som svar
from schemas import PrivacyRequestCreate, PrivacyRequestRead


# Skapar en router:
# - prefix="/privacy-requests": alla endpoints här får den prefixen automatiskt
# - tags=[...]: snygg kategorisering i Swagger /docs
router = APIRouter(prefix="/privacy-requests", tags=["Privacy Requests"])



# POST-endpoint: skapar ett nytt privacy request i databasen
@router.post(
    "", # tom sträng betyder: exakt "/privacy-requests" (p.g.a. prefixen ovan)
    response_model=PrivacyRequest,      # FastAPI validerar och serialiserar svaret enligt detta schema
    status_code=status.HTTP_201_CREATED # returnera 201 när en resurs skapas
)
async def create_privacy_request(
    payload: PrivacyRequestCreate,               # payload = request body (JSON) som måste matcha PrivacyRequestCreate
    session: AsyncSession = Depends(get_session) # session injiceras automatiskt via Depends
):
    # Skapar en SQLAlchemy-rad (objekt) som matchar DB-tabellen
    new_row = PrivacyRequest(
        company_name=payload.company_name,          # tar värdet från payload
        company_email=str(payload.company_email),   # EmailStr -> str för DB (funkar fint)
        full_name=payload.full_name,                # matchar modellen
        city=payload.city,                          # kan vara None
        profile_url=payload.profile_url,            # kan vara None
        # status defaultar till "draft" i modellen, så vi behöver inte skicka den här
    )

    # Lägger till objektet i sessionen (som en "pending insert")
    session.add(new_row)

    # Sparar ändringen i databasen (INSERT sker här)
    await session.commit()

    # Hämtar tillbaka ny data från DB (t.ex. auto-id, created_at)
    await session.refresh(new_row)

    # Returnerar objektet -> FastAPI gör om det till JSON enligt response_model
    return new_row


# GET-endpoint: listar alla privacy requests
@router.get(
    "", # blir "/privacy-requests"
    response_model=list[PrivacyRequest] # vi retunerar en lista av PrivacyRequestRead
)
async def list_privacy_requests(
    session: AsyncSession = Depends(get_session), # DB-session injiceras
):
    # Bygger en SELECT query som sorterar senaste först (högst id)
    stmt = select(PrivacyRequest).order_by(PrivacyRequest.id.desc())

    # Kör queryn mot DB (async)
    result = await session.execute(stmt)

    # result.scalars() = plockar ut modell-objekten (inte tuples)
    # .all() tar alla rader
    rows = result.scalars().all

    # Gör om till en vanlig lista (oftast onödigt, men tydligt)
    return list(rows)



# GET-endpoint: hämtar en privacy request via id
@router.get(
    "/{request_id}", # path-parameter, t.ex. /privacy-requests/12
    response_model=PrivacyRequestRead,
)
async def get_privacy_request(
    request_id: int, # FastAPI plockar den från URL:en och gör en int-konvertering
    session: AsyncSession = Depends(get_session),
):
    # Bygger en query som letar efter exakt id
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id)

    # kör queryn
    result = await session.execute(stmt)

    #scalar_one_or_none() = ger tillbaka:
    # - objektet om det finns exakt 1 match
    # - None om ingen match
    row = result.scalar_one_or_none()

    # Om raden inte hittas -> returnera 404
    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    # ANnars returneras objektet som JSON
    return row