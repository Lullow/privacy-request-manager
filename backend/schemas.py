# datetime behövs för create_at i respons-modellen
from datetime import datetime

# Basemodel: basen för pydantic-modeller
# EmailStr: Pydantic-typ som validerar att en sträng är en riktig email
from pydantic import BaseModel, EmailStr


class PrivacyRequestCreate(BaseModel):
    # Företagsnamn: (obligatoriskt)
    company_name: str

    # Företagets email (valideras som ett riktigt email genom "EmailStr import")
    company_email: str

    # Stad (valfritt)
    city: str | None = None

    # Profil-länk (valfritt)
    profile_link: str | None = None
