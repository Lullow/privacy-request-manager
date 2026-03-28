# - APIRouter: gör en "mini-app" med routes (endpoints) som du kan koppla in i main.py
# - Depends: dependency injection (t.ex. hämta DB-session automatiskt)
# - HTTPException: kasta ett kontrollerat fel (t.ex. 404) som API:t returnerar som JSON
# - status: färdiga HTTP-statuskoder (201, 404 osv)
# get_session: vår egen dependency som skapar/stänger DB-session per request
from auth.dependencies import get_current_user
from connect_db import get_session
from fastapi import APIRouter, Depends, HTTPException, status

# PrivacyRequest: SQLAlchemy-modellen (tabellen) vi sparar/läser i DB
# Message för att kunna spara AI-genererade meddelande i databasen
from models import Message, PrivacyRequest, User

# - PrivacyRequestCreate: datan vi förväntar oss från frontend när man skapar
# - PrivacyRequestRead: datan vi skickar tillbaka som svar
# - PrivacyRequestUpdate: För att updatera datan
# - MessageRead: för att läsa/svara med sparade meddelanden (AI-integrering)
# - GenerateMessageRequest: för payloaden som skickas in när frontend vill generera ett meddelande (AI-integrering)
# - GenerateMessageResponse: för svaret som backend skickar tillbaka efter AI-generering (AI-integrering)
from schemas import (
    GenerateMessageRequest,
    GenerateMessageResponse,
    MessageRead,
    PrivacyRequestCreate,
    PrivacyRequestRead,
    PrivacyRequestUpdate,
    SendRequestBody,
)

# Importerar själva funktionen som bygger GDPR-meddelandet
# Den här funktionen ska skapa subject och body baserat på requestens data
from services.ai_generator import generate_gdpr_message, generate_legal_gdpr_message
from services.email_sender import send_email

# - select: bygger en SELECT-query (typ "SELECT * FROM privacy_request")
from sqlalchemy import select

# AsyncSession: själva DB-sessionen som används när vi kör async mot databasen
from sqlalchemy.ext.asyncio import AsyncSession

# TODO: from services.ai_generator import generate_gdpr_message <- detta kommer behövas eventuellt (installation av paketen krävs)

# Skapar en router:
# - prefix="/privacy-requests": alla endpoints här får den prefixen automatiskt
# - tags=[...]: snygg kategorisering i Swagger /docs
router = APIRouter(prefix="/privacy-requests", tags=["Privacy Requests"])


# Tar emot data från frontend, skapar en ny rad i databasen och returnerar den sparade raden med id och created_at.
# CREATE-endpoint: skapar ett nytt privacy request i databasen
@router.post(
    "",  # tom sträng betyder: exakt "/privacy-requests" (p.g.a. prefixen ovan)
    response_model=PrivacyRequestRead,  # FastAPI validerar och serialiserar svaret enligt detta schema
    status_code=status.HTTP_201_CREATED,  # returnera 201 när en resurs skapas
)
async def create_privacy_request(
    payload: PrivacyRequestCreate,  # payload = request body (JSON) som måste matcha PrivacyRequestCreate
    session: AsyncSession = Depends(get_session),  # session injiceras automatiskt via Depends
    current_user: User = Depends(get_current_user)
):

    # Skapar en SQLAlchemy-rad (objekt) som matchar DB-tabellen
    new_row = PrivacyRequest(
        company_name=payload.company_name,         # tar värdet från payload
        company_email=str(payload.company_email),  # EmailStr -> str för DB (funkar fint)
        full_name=payload.full_name,               # matchar modellen
        city=payload.city,                         # kan vara None
        birth_date=payload.birth_date,             # kan vara None
        profile_url=str(payload.profile_url) if payload.profile_url else None,
        tone=payload.tone, # Sparar användarens valda ton/stil redan när request skapas (AI-integrering)
        status="draft",     # Sätter första statusen till "draft". Det betyder att requestet finns i databasen, men att inget AI-meddelande har genererats ännu
        user_id=current_user.id,
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
    response_model=list[PrivacyRequestRead], # vi retunerar en lista av PrivacyRequestRead
)
async def list_privacy_requests(
    session: AsyncSession = Depends(get_session),  # DB-session injiceras
    status: str | None = None,
    current_user: User = Depends(get_current_user),
):
    # Bygger en SELECT query som sorterar senaste först (högst id)
    stmt = select(PrivacyRequest).where(PrivacyRequest.user_id == current_user.id).order_by(PrivacyRequest.id.desc())

    # Om användaren skickade med ?status=draft i URL:en — alltså om status inte är None.
    # Med if status filtrerar den på det värdet användaren skickade in.
    if status:
        stmt = stmt.where(PrivacyRequest.status == status)

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
    current_user: User = Depends(get_current_user)
):
    # Bygger en query som letar efter exakt id
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id, PrivacyRequest.user_id == current_user.id)

    # kör queryn
    result = await session.execute(stmt)

    # scalar_one_or_none() = ger tillbaka:
    # - objektet om det finns exakt 1 match
    # - None om ingen match
    row = result.scalar_one_or_none()

    # Om raden inte hittas -> returnera 404
    if row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found") # TODO: Ändra status_code till mer beskrivande?

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
    current_user: User = Depends(get_current_user),
):
    # SELECT * FROM privacy_request WHERE id = 3, bygger denna men kör den inte än.
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id, PrivacyRequest.user_id == current_user.id)

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
    current_user: User = Depends(get_current_user)
):
    # Det är som att säga: "Bygg en SQL-query som letar upp raden där id = det nummer användaren skickade in."
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id, PrivacyRequest.user_id == current_user.id)
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
    return {"message": "Privacy request deleted"}


# ~ CREATE ENDPOINT - AI-generate-endpoint
# Skapar en POST-endpoint på /{request_id}/generate
# Exempel: /api/privacy-requests/5/generate
@router.post(
    "/{request_id}/generate",
    response_model = GenerateMessageResponse, # Talar om att svaret från endpointen ska följa detta schema
)
async def generate_request_message(
    request_id: int,                              # request_id hämtas från URL:en
    payload: GenerateMessageRequest,              # payload kommer från frontendens request body, här finns t.ex. tone och message_type
    session: AsyncSession = Depends(get_session), # Hämtar en databassession via Depends
    current_user: User = Depends(get_current_user),
):
    # Bygger en SQL-fråga som letar efter rätt PrivacyRequest via id (hämtar requesten från databasen)
    stmt = select(PrivacyRequest).where(PrivacyRequest.id == request_id, PrivacyRequest.user_id == current_user.id)
    # Kör SQL-frågan mot databasen
    result = await session.execute(stmt)
    # Hämtar ut ett objekt om det finns, annars None
    request_row = result.scalar_one_or_none()

    # Kasta 404 statuskod om requesten inte finns
    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")
    
    # Väljer rätt generator beroende på om juridisk mall begärts
    birth_date = payload.birth_date or request_row.birth_date

    if payload.use_legal_template:
        generated = generate_legal_gdpr_message(
            company_name=request_row.company_name,
            full_name=request_row.full_name,
            personal_number=payload.personal_number or "",
            birth_date=birth_date,
            address=payload.legal_address,
            phone=payload.legal_phone,
            registrant_email=payload.legal_email,
        )
    else:
        generated = generate_gdpr_message(
            company_name=request_row.company_name,
            company_email=request_row.company_email,
            full_name=request_row.full_name,
            city=request_row.city,
            profile_url=request_row.profile_url,
            birth_date=birth_date,
            tone=payload.tone,
            message_type=payload.message_type,
            request_types=payload.request_types,
        )

    # Skapar ett nytt Message-objekt som ska sparas i message-tabellen
    new_message = Message(
        privacy_request_id=request_row.id, # Kopplar meddelandet till rätt privacy request
        message_type=payload.message_type, # Sparar vilken typ av meddelande det är
        source="ai",                       # Visar att detta meddelande skapades av AI
        subject=generated["subject"],      # Sparar ämnesraden som AI-funktionen genererat
        message_body=generated["message_body"], # Sparar själva meddelandetexten
        tone=payload.tone,                 # Sparar tonen som användes vid genereringen
    )
    # Lägger till det nya Message-objektet i databassessionen
    session.add(new_message)

    # Uppdaterar requestets tone till den senaste tonen som användes
    request_row.tone = payload.tone 
    # Ändrar status från exempelvis "draft" till "generated"
    # Det betyder att ett AI-meddelande nu har skapats för requestet
    request_row.status = "generated"

    await session.commit()              # Sparar alla ändringar i databasen
    await session.refresh(new_message)  # Uppdaterar new_message från databasen så att vi får t.ex. id och created_at

    # Returnerar svaret till frontend enligt GenerateMessageResponse
    return GenerateMessageResponse(
        subject=new_message.subject,            # Skickar tillbaka subject
        message_body=new_message.message_body,  # Skickar tillbaka meddelandetexten
        message_type=new_message.message_type,  # Skickar tillbaka typen av meddelande
        tone=new_message.tone,                  # Skickar tillbaka tonen
    )

# Skapa GET-endpoint på /{request_id}/messages
# Exempel: /api/privacy-request/5/messages
@router.get(
    "/{request_id}/messages",
    # Talar om att endpoint ska returnera en lista av MessageRead-objektet (alltså flera messages, inte bara en enda)
    response_model=list[MessageRead]
)
async def list_request_messages(
    #request_id hämtas från URL:en
    request_id: int,
    # Hämtar databassessionen via Depends
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Bygger en SQL-fråga för att först kontrollera om privacy requestet finns i databasen
    stmt_request = select(PrivacyRequest).where(PrivacyRequest.id == request_id, PrivacyRequest.user_id == current_user.id)

    # Kör SQL-frågan
    result_request = await session.execute(stmt_request)

    # Hämtar ut objektet om det finns, annars None
    request_row = result_request.scalar_one_or_none()

    # Om request inte finns, skicka tillbaka 404
    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")
    
    # Bygger en ny SQL-fråga som hämtar alla messages som hör till just detta privacy request
    stmt_messages = (
        # Filtrera så att bara messages med rätt privacy_request_id hämtas
        # Sortera resultat i fallande ordning så de senaste messages kommer först
        select(Message).where(Message.privacy_request_id == request_id).order_by(Message.id.desc())
    )

    # Kör frågan mot databasen
    result_message = await session.execute(stmt_messages)

    # Hämta ut alla Message objekt som en lista
    rows = result_message.scalars().all()

    # Returna listan med messages
    # FastAPI omvandlar den till response_model=list[MessageRead]
    return list(rows)


# POST-endpoint: skickar det genererade mejlet till företaget å användarens vägnar
# Exempel: /api/privacy-requests/5/send
@router.post("/{request_id}/send")
async def send_privacy_request(
    request_id: int,
    payload: SendRequestBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Hämtar rätt privacy request från databasen
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    result = await session.execute(stmt)
    request_row = result.scalar_one_or_none()

    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    # Hämtar det senaste genererade meddelandet för ärendet
    stmt_msg = (
        select(Message)
        .where(Message.privacy_request_id == request_id)
        .order_by(Message.id.desc())
    )
    result_msg = await session.execute(stmt_msg)
    message = result_msg.scalars().first()

    if message is None:
        raise HTTPException(status_code=400, detail="Inget genererat meddelande hittades för detta ärende")

    # Substituerar [PERSONNUMMER] med verkligt personnummer om det skickades med
    body = message.message_body
    if payload.personal_number and "[PERSONNUMMER]" in body:
        body = body.replace("[PERSONNUMMER]", payload.personal_number)

    # Skickar mejlet
    try:
        await send_email(
            to=request_row.company_email,
            subject=message.subject,
            body=body,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kunde inte skicka mejlet: {str(e)}")

    # Uppdaterar status till "sent"
    request_row.status = "sent"
    await session.commit()

    return {"message": "Mejlet skickades"}


# POST-endpoint: genererar och skickar en påminnelse för ett ärende
# Exempel: /api/privacy-requests/5/reminder
@router.post("/{request_id}/reminder")
async def send_reminder(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PrivacyRequest).where(
        PrivacyRequest.id == request_id,
        PrivacyRequest.user_id == current_user.id,
    )
    result = await session.execute(stmt)
    request_row = result.scalar_one_or_none()

    if request_row is None:
        raise HTTPException(status_code=404, detail="Privacy request not found")

    generated = generate_gdpr_message(
        company_name=request_row.company_name,
        company_email=request_row.company_email,
        full_name=request_row.full_name,
        city=request_row.city,
        profile_url=request_row.profile_url,
        birth_date=request_row.birth_date,
        tone=request_row.tone,
        message_type="follow_up",
        request_types=["delete"],
    )

    new_message = Message(
        privacy_request_id=request_row.id,
        message_type="follow_up",
        source="ai",
        subject=generated["subject"],
        message_body=generated["message_body"],
        tone=request_row.tone,
    )
    session.add(new_message)

    try:
        await send_email(
            to=request_row.company_email,
            subject=generated["subject"],
            body=generated["message_body"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kunde inte skicka påminnelsen: {str(e)}")

    request_row.status = "waiting"
    await session.commit()

    return {"message": "Påminnelse skickad"}