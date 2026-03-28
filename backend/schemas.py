# datetime behövs för create_at i respons-modellen
from datetime import datetime

# Basemodel: basen för pydantic-modeller
# EmailStr: Pydantic-typ som validerar att en sträng är en riktig email
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator


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

    # Födelsedag i formatet ÅÅÅÅ-MM-DD (valfritt, rekommenderas för identifiering)
    birth_date: str | None = None

    # Profil-länk (valfritt).  #menar du profile URL? #TODO Ja, ändrat den nu, tack!
    profile_url: HttpUrl | None = None

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
    birth_date: str | None
    profile_url: str | None
    tone: str
    status: str
    created_at: datetime

    # Gör så att Pydantic kan läsa från SQLAlchemy-objekt
    model_config = {"from_attributes": True}


# ~ PRIVACY REQUEST - UPDATE
# för PUT, status är den enda som uppdateras
class PrivacyRequestUpdate(BaseModel):
    status: Literal["draft", "generated", "sent"]


# Vad frontend skickar när man registrerar ett konto
def _validate_redirect_to(v: str | None) -> str | None:
    if v is None:
        return v
    if not v.startswith("/") or "//" in v or "@" in v:
        raise ValueError("redirect_to måste vara en relativ sökväg, t.ex. /dashboard")
    return v


class UserCreate(BaseModel):
    email: EmailStr
    password: str  # klartext här — hashas sedan i auth-logiken
    redirect_to: str | None = None  # Sidan att skicka användaren till efter e-postverifiering

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Lösenordet måste vara minst 8 tecken.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Lösenordet måste innehålla minst en siffra.")
        if not any(c.isalpha() for c in v):
            raise ValueError("Lösenordet måste innehålla minst en bokstav.")
        return v

    @field_validator("redirect_to")
    @classmethod
    def validate_redirect_to(cls, v: str | None) -> str | None:
        return _validate_redirect_to(v)


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


class ResendVerificationRequest(BaseModel):
    email: EmailStr
    redirect_to: str | None = None

    @field_validator("redirect_to")
    @classmethod
    def validate_redirect_to(cls, v: str | None) -> str | None:
        return _validate_redirect_to(v)


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

    # Födelsedag för identifiering i genererat mejl (ej sparat i DB via generate-endpointen)
    birth_date: str | None = None

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


# ~ SEND REQUEST - BODY ~
# Payload för POST /{request_id}/send
# personal_number skickas från frontend vid juridisk begäran för att substituera [PERSONNUMMER]
class SendRequestBody(BaseModel):
    personal_number: str | None = None
