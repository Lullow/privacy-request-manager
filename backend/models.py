# datetime används för att kunna sätta default-tidpunkt (created_at)
from datetime import datetime, timezone

# Importerar SQL-typer som beskriver kolumners datatyper i databasen
# - DateTime: datum + tid
# - String: text med maxlängd (i DB blir det ofta VARCHAR)
# - Text: text utan fast maxlängd
# from datetime import datetime importerar Python-klassen datetime — den används för defaultvärde
# DateTime — talar om för databasen vad kolumnen är för typ
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text

# Importerar ORM-delarna:
# - DeclarativeBase: bas-klassen som alla modeller bygger på
# - Mapped: typ-hint som talar om för SQLAlchemy att detta är ett ORM-fält/kolumn
# - mapped_column: funktionen som definierar en kolumn (typ, constraints, default, osv)
# - relationship: Möjliggör en koppling mellan två modeller
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# Base-klassen är “startpunkten” för alla dina modeller.
# SQLAlchemy samlar metadata från Base för att kunna skapa tabeller och migrations.
class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"

    # Primary-key för användaren
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True)
    # Du lagrar aldrig lösenordet i klartext i databasen (säkerhetsregel)
    # Om databasen läckte och du hade sparat lösenord123 direkt, kan vem som helst logga in som alla användare. Istället hashar du lösenordet
    password_hash: Mapped[str] = mapped_column(String(200))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    tokens: Mapped[list["Token"]] = relationship(back_populates="user", cascade="all, delete-orphan")


# __tablename__ berättar vilket namn tabellen ska ha i databasen.
# Viktigt: måste matcha om du redan skapat tabellen i DB.
class PrivacyRequest(Base):
    __tablename__ = "privacy_request"  # tabellens namn i databasen

    # Primary-key
    # id är primärnyckeln (PK).
    # primary_key=True gör den unik + ofta auto-increment (Postgres: SERIAL/IDENTITY-liknande beteende)
    # Mapped[int] är en “SQLAlchemy-typ hint” som gör att ORM fattar att detta är en kolumn.
    id: Mapped[int] = mapped_column(primary_key=True)

    # Företagets namn
    # company_name blir en kolumn av typen String(200) (VARCHAR(200) typiskt)
    # required (nullable=False implicit) eftersom du inte satt nullable=True
    company_name: Mapped[str] = mapped_column(String(200))

    # Företagets e-post
    # company_email lagras också som String(200)
    # Här gör du ingen email-validering i DB – det gör du istället i Pydantic-schemas (om du vill).
    company_email: Mapped[str] = mapped_column(String(200))

    # Användarens för- och efternamn
    # full_name blir en kolumn av typen String(200) (VARCHAR(200) typiskt)
    # required (nullable=False implicit) eftersom du inte satt nullable=True
    full_name: Mapped[str] = mapped_column(String(200))

    # Stad (kan vara tom)
    # city får vara None (valfritt fält).
    # Typen "str | None" betyder att Python kan ha None,
    # och nullable=True säger att DB-kolumnen också får vara NULL.
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)

    # Födelsedag (kan vara tom) — används för identifiering i GDPR-begäran
    # Sparas som sträng i formatet ÅÅÅÅ-MM-DD
    birth_date: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Profil-URL (kan vara tom)
    # profile_url får vara None.
    # Du använder String(200) här: bra för kortare länkar.
    # Om du tror att URLs kan bli längre kan du byta till Text istället.
    profile_url: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # kopplar varje ärende till en specifik användare.
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))

    # Tone för AI-generering
    # Sparar vilket tonläge som AI:n ska använda, exempelvis: neutral, formal, friendly
    # Om inget skickas in blir standardvärdet "neutral"
    tone: Mapped[str] = mapped_column(String(50), default="neutral")

    # Sparar vilket läge requestet är i, exempelvis: "draft" eller "sent".
    # Om inget skickas in blir standardvärdet "draft".
    status: Mapped[str] = mapped_column(String(50), default="draft")

    # När ärendet skapas
    # created_at sparar när ärendet skapades.
    # default=lambda: datetime.now(timezone.utc) betyder att tiden sätts när raden skapas.
    # utcnow används ofta för att slippa tidszonsstrul.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship till Message
    # En request kan ha flera AI- eller manuella meddelanden (one-to-many-relationship)
    # Använder [[]] för att detta fält kommer innehålla en list av MEssage objekt
    # relationship förklarar för SQLQalchemy att detta inte är en "vanlig" kolumn, utan en "länk" mellan två modeller.
    # back_populates connectar denna relationen till den matchande relationship i Message modellen (privacy_request)
    # Det gör att att relationen funkar "both directions"
    # request.message -> alla messages för request
    # message.pricavy_request -> parent request för ett message
    # cascade="all, delete-orphan": Om ett request tas bort, tas även dess messages bort.
    messages: Mapped[list["Message"]] = relationship(
        back_populates="privacy_request", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "message"

    # Primärnyckel för varje message-rad i tabellen (Varje meddelande får ett unikt id)
    id: Mapped[int] = mapped_column(primary_key=True)

    # Foregin-key till den privacy_request som meddelandet hör till (kopplar detta message till ett visst PrivacyRequest)
    # Det betyder att varje message tillhör ett specifikt request.
    privacy_request_id: Mapped[int] = mapped_column(ForeignKey("privacy_request.id"))

    # Vilken typ av message är detta, exempelvis: initial_request, follow-up
    # Kan t.ex. användas för att skilja på olika slags meddelanden,
    # som "email", "reminder" eller "followup".
    message_type: Mapped[str] = mapped_column(String(50))

    # Vem skapade meddelandet, exempelvis: AI eller manuellt av användaren
    source: Mapped[str] = mapped_column(String(50), default="ai")

    # Ämnesrad för meddelandet
    # Passar bra om message ska representera ett mail eller liknande.
    subject: Mapped[str] = mapped_column(String(255))

    # Själva innehållet för meddelande texten
    message_body: Mapped[str] = mapped_column(Text)

    # Tone sparas för att veta hur AI genererade texten
    # Standard blir "neutral" om inget värde skickas in
    tone: Mapped[str] = mapped_column(String(50), default="neutral")

    # När meddelandet skapades
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship tillbaka till PrivacyRequest
    # Det gör att man från ett Message-objekt kan nå requestet det tillhör.
    privacy_request: Mapped["PrivacyRequest"] = relationship(back_populates="messages")

class Token(Base):
    __tablename__ = "token"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(255), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="tokens")

