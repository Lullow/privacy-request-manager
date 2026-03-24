# datetime behövs för create_at i respons-modellen
from datetime import datetime

# Basemodel: basen för pydantic-modeller
# EmailStr: Pydantic-typ som validerar att en sträng är en riktig email
from pydantic import BaseModel, EmailStr, Field


# ~ PRIVACY REQUEST - CREATE ~
# Vad frontend skickar in när den skapar ett nytt ärende
class PrivacyRequestCreate(BaseModel):
    # Företagsnamn: (obligatoriskt)
    company_name: str

    # Företagets email (valideras som ett riktigt email genom "EmailStr import" (obligatoriskt))
    company_email: EmailStr

    # Användarens för- och efternamn (obligatoriskt)
    full_name: str

    # Stad (valfritt)
    city: str | None = None

    # Profil-länk (valfritt).  #menar du profile URL? #TODO Ja, ändrat den nu, tack!
    profile_url: str | None = None

    # Tone för AI anvädning
    # Om frontend inte skickar tone så är request "neutral" som standard
    tone: str = "neutral"


# Vad API:t skickar tillbaka (inkl id och created_at)
class PrivacyRequestRead(BaseModel):
    id: int
    company_name: str
    company_email: EmailStr
    full_name: str
    city: str | None
    profile_url: str | None
    tone: str
    status: str
    created_at: datetime

    # Gör så att Pydantic kan läsa från SQLAlchemy-objekt
    model_config = {"from_attributes": True}


# ~ PRIVACY REQUEST - UPDATE
# för PUT, status är den enda som uppdateras
class PrivacyRequestUpdate(BaseModel):
    status: str


# Vad frontend skickar när man registrerar ett konto
class UserCreate(BaseModel):
    email: EmailStr
    password: str  # klartext här — hashas sedan i auth-logiken


# Vad API:t skickar tillbaka efter register/login (aldrig password!) password från frontend används bara för att hasha och spara password_hash i databasen — sedan kastas klartext-lösenordet.
class UserRead(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


# Vad frontend skickar vid inloggning
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ~ MESSAGE - READ ~
class MessageRead(BaseModel):
    id: int
    privacy_request_id: int
    message_type: str
    source: str
    subject: str
    message_body: str
    tone: str 
    created_at: datetime

    model_config = {"from_attributes": True}


# ~ AI GENERATE - REQUEST ~
class GenerateMessageRequest(BaseModel):
    # Om användaren väljer att ändra läge (tone)
    tone: str = "neutral"

    # Vilken typ av text som ska genereras, exempelvis: initial_request eller follow_up
    message_type: str = "initial_request"

    # Field(default_factory=list) är säkrare än att använda en tom lista direkt som default.
    request_types: list[str] = Field(default_factory=list)

    # Juridisk begäran — aktiveras när frontend skickar use_legal_template=True
    use_legal_template: bool = False
    personal_number: str | None = None   # Personnummer (ej sparat i DB)
    legal_address: str | None = None
    legal_phone: str | None = None
    legal_email: str | None = None


# ~ AI GENERATE - RESPONSE ~
class GenerateMessageResponse(BaseModel):
    subject: str
    message_body: str
    message_type: str
    tone: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str