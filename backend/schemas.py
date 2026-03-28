import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator


# --- Privacy Request ---

class PrivacyRequestCreate(BaseModel):
    company_name: str
    company_email: EmailStr
    full_name: str
    city: str | None = None
    birth_date: str | None = None
    profile_url: HttpUrl | None = None
    tone: str = "neutral"

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v: str | None) -> str | None:
        if v is not None and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            raise ValueError("birth_date must be in YYYY-MM-DD format, e.g. 1990-01-31")
        return v


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

    model_config = {"from_attributes": True}


class PrivacyRequestUpdate(BaseModel):
    # Only status updates are supported. Literal enforces the allowed values.
    status: Literal["draft", "generated", "sent"]


# --- Auth ---

def _validate_redirect_to(v: str | None) -> str | None:
    # Allow only relative paths to prevent open-redirect attacks.
    # "//" would allow protocol-relative URLs; "@" is used in some redirect exploits.
    if v is None:
        return v
    if not v.startswith("/") or "//" in v or "@" in v:
        raise ValueError("redirect_to must be a relative path, e.g. /dashboard")
    return v


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    redirect_to: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter.")
        return v

    @field_validator("redirect_to")
    @classmethod
    def validate_redirect_to(cls, v: str | None) -> str | None:
        return _validate_redirect_to(v)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# --- Messages ---

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


# --- AI generation ---

class GenerateMessageRequest(BaseModel):
    tone: str = "neutral"
    message_type: str = "initial_request"
    # default_factory avoids the mutable-default-argument pitfall with lists.
    request_types: list[str] = Field(default_factory=list)
    birth_date: str | None = None
    use_legal_template: bool = False
    # Fields used only when use_legal_template=True.
    personal_number: str | None = None
    legal_address: str | None = None
    legal_phone: str | None = None
    legal_email: str | None = None


class GenerateMessageResponse(BaseModel):
    subject: str
    message_body: str
    message_type: str
    tone: str


# --- Send ---

class SendRequestBody(BaseModel):
    # personal_number is substituted into the message body at send time,
    # replacing the [PERSONNUMMER] placeholder. It is never stored in the database.
    personal_number: str | None = None
