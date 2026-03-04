# datetime behövs för create_at i respons-modellen
from datetime import datetime

# Basemodel: basen för pydantic-modeller
# EmailStr: Pydantic-typ som validerar att en sträng är en riktig email
from pydantic import BaseModel, EmailStr

# Vad frontend skickar in när den skapar ett nytt ärende
class PrivacyRequestCreate(BaseModel):
    # Företagsnamn: (obligatoriskt)
    company_name: str

    # Företagets email (valideras som ett riktigt email genom "EmailStr import")
    company_email: str

    # Stad (valfritt)
    city: str | None = None

    # Profil-länk (valfritt)
    profile_link: str | None = None

# Vad API:t skickar tillbaka (inkl id och created_at)
class PrivacyRequestRead(BaseModel):
    id: int
    company_name: str
    company_email: EmailStr
    full_name: str
    city: str | None
    profile_url: str | None
    status: str
    created_at: datetime

    # Gör så att Pydantic kan läsa från SQLAlchemy-objekt
    model_config = {'from_attributes': True}