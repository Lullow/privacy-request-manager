from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True)
    # Passwords are never stored in plain text — only the bcrypt hash.
    password_hash: Mapped[str] = mapped_column(String(200))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Token is set on registration and cleared once the email is verified.
    verification_token: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # cascade="all, delete-orphan" ensures tokens are deleted when the user is deleted.
    tokens: Mapped[list["Token"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class PrivacyRequest(Base):
    __tablename__ = "privacy_request"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(String(200))
    company_email: Mapped[str] = mapped_column(String(200))
    full_name: Mapped[str] = mapped_column(String(200))
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Stored as a plain string in YYYY-MM-DD format; validated in the schema layer.
    birth_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String(200), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    # tone controls the writing style used when generating AI messages.
    tone: Mapped[str] = mapped_column(String(50), default="neutral")
    # status lifecycle: draft → generated → sent (or "waiting" after a reminder).
    status: Mapped[str] = mapped_column(String(50), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # cascade="all, delete-orphan" removes associated messages when the request is deleted.
    messages: Mapped[list["Message"]] = relationship(
        back_populates="privacy_request", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "message"

    id: Mapped[int] = mapped_column(primary_key=True)
    privacy_request_id: Mapped[int] = mapped_column(ForeignKey("privacy_request.id"))
    # message_type distinguishes between initial requests and follow-ups.
    message_type: Mapped[str] = mapped_column(String(50))
    # source indicates who created the message: "ai" or "manual".
    source: Mapped[str] = mapped_column(String(50), default="ai")
    subject: Mapped[str] = mapped_column(String(255))
    message_body: Mapped[str] = mapped_column(Text)
    tone: Mapped[str] = mapped_column(String(50), default="neutral")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    privacy_request: Mapped["PrivacyRequest"] = relationship(back_populates="messages")


class Token(Base):
    __tablename__ = "token"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(255), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="tokens")
