# - APIRouter: gör en "mini-app" med routes (endpoints) som du kan koppla in i main.py
# - Depends: dependency injection (t.ex. hämta DB-session automatiskt)
# - HTTPException: kasta ett kontrollerat fel (t.ex. 404) som API:t returnerar som JSON
# - status: färdiga HTTP-statuskoder (201, 404 osv)
# get_session: vår egen dependency som skapar/stänger DB-session per request
from connect_db import get_session
from fastapi import APIRouter, Depends, HTTPException, status

# PrivacyRequest: SQLAlchemy-modellen (tabellen) vi sparar/läser i DB
from models import PrivacyRequest

# - PrivacyRequestCreate: datan vi förväntar oss från frontend när man skapar
# - PrivacyRequestRead: datan vi skickar tillbaka som svar
from schemas import PrivacyRequestCreate, PrivacyRequestRead, PrivacyRequestUpdate

# Skapar en router:
# - prefix="/privacy-requests": alla endpoints här får den prefixen automatiskt
# - tags=[...]: snygg kategorisering i Swagger /docs
router = APIRouter(prefix="/privacy-requests", tags=["Privacy Requests"])


# Tar emot data från frontend, skapar en ny rad i databasen och returnerar den sparade raden med id och created_at.
# POST-endpoint: skapar ett nytt privacy request i databasen
@router.post(
    "",  # tom sträng betyder: exakt "/privacy-requests" (p.g.a. prefixen ovan)
    response_model=PrivacyRequestRead,  # FastAPI validerar och serialiserar svaret enligt detta schema
    status_code=status.HTTP_201_CREATED,  # returnera 201 när en resurs skapas
)
async def create_privacy_request(
    payload: PrivacyRequestCreate,  # payload = request body (JSON) som måste matcha PrivacyRequestCreate
    session: AsyncSession = Depends(
        get_session
    ),  # session injiceras automatiskt via Depends
):
    # Skapar en SQLAlchemy-rad (objekt) som matchar DB-tabellen
    new_row = PrivacyRequest(
        company_name=payload.company_name,  # tar värdet från payload
        company_email=str(
            payload.company_email
        ),  # EmailStr -> str för DB (funkar fint)
        full_name=payload.full_name,  # matchar modellen
        city=payload.city,  # kan vara None
        profile_url=payload.profile_url,  # kan vara None
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
    "",  # blir "/privacy-requests"
    response_model=list[
        PrivacyRequestRead
    ],  # vi retunerar en lista av PrivacyRequestRead
)
async def list_privacy_requests(
    session: AsyncSession = Depends(get_session),  # DB-session injiceras
):
    # Bygger en SELECT query som sorterar senaste först (högst id)
    stmt = select(PrivacyRequest).order_by(PrivacyRequest.id.desc())

    # Kör queryn mot DB (async)
    result = await session.execute(stmt)

    # result.scalars() = plockar ut modell-objekten (inte tuples)
    # .all() tar alla rader
    rows = result.scalars().all()

    # Gör om till en vanlig lista (oftast onödigt, men tydligt)
    return list(rows)


# GET-endpoint: hämtar en privacy request via id.
# Hämtar en specifik privacy request via id i URL:en. Returnerar den om den finns, annars ett 404-fel.
@router.get(
    "/{request_id}",  # path-parameter, t.ex. /privacy-requests/12
    response_model=PrivacyRequestRead,
)
async def get_privacy_request(
    request_id: int,  # FastAPI plockar den från URL:en och gör en int-konvertering
    session: AsyncSession = Depends(get_session),
):
    # Bygger en query som letar efter exakt id
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id)

    # kör queryn
    result = await session.execute(stmt)

    # scalar_one_or_none() = ger tillbaka:
    # - objektet om det finns exakt 1 match
    # - None om ingen match
    row = result.scalar_one_or_none()

    # Om raden inte hittas -> returnera 404
    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    # ANnars returneras objektet som JSON
    return row


# Efter att du uppdaterat status vill du skicka tillbaka hela den uppdaterade begäran — inte bara status — så användaren ser den nya statusen tillsammans med all annan info
# request id kommer från frontend
@router.put(
    "/{request_id}",
    response_model=PrivacyRequestRead,
)
# asynkron funktion, behövs för await
async def update_privacy_request(
    request_id: int,
    # payload för att inte behöva skriva PrivacyRequestUpdate.status varje gång
    payload: PrivacyRequestUpdate,
    # Depends(get_session) talar om för FastAPI att köra get_session() automatiskt och ge resultatet till session.
    session: AsyncSession = Depends(get_session),
):
    # SELECT * FROM privacy_request WHERE id = 3, bygger denna men kör den inte än.
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id)

    # session.execute(stmt) Skickar SQL-queryn (stmt) till databasen och kör den.
    # await väntar på att databasen svarar innan koden fortsätter
    # result håller svaret från databasen Håller svaret från databasen — alla rader som matchade queryn. Men det är rådata ännu, inte rena Python-objekt. Därför behöver du .scalar_one_or_none() på nästa rad för att plocka ut objektet.
    result = await session.execute(stmt)
    # Varför inte bara result direkt? För att result är rådata från databasen — scalar_one_or_none() omvandlar det till ett rent Python-objekt du kan använda.
    row = result.scalar_one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")
    # Så row.status är kolumnen i databasen, och payload.status är värdet frontend skickade in. Du kopierar värdet från payload till raden
    row.status = payload.status
    await session.commit()
    await session.refresh(row)
    return row


@router.delete("/{request_id}")
async def delete_privacy_request(
    request_id: int,
    session: AsyncSession = Depends(get_session),
):
    # Det är som att säga: "Bygg en SQL-query som letar upp raden där id = det nummer användaren skickade in."
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id)
    # result = råsvaret från databasen (inte ett rent Python-objekt än)
    # await = vänta tills databasen svarar innan koden fortsätter
    # session.execute(stmt) = skickar den till databasen och kör den
    # stmt = instruktionen du byggde (SELECT ... WHERE id = 5)
    result = await session.execute(stmt)
    # result = rådata från databasen (kan innehålla flera rader, tuples osv)
    # .scalar_one_or_none() = ge mig exakt ett objekt, eller None om inget hittades
    row = result.scalar_one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    await session.delete(row)
    await session.commit()
