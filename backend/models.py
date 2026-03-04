# datetime används för att kunna sätta default-tidpunkt (created_at)
from datetime import datetime

# Importerar SQL-typer som beskriver kolumners datatyper i databasen
# - DateTime: datum + tid
# - String: text med maxlängd (i DB blir det ofta VARCHAR)
# - Text: (inte använd i din kod just nu) text utan fast maxlängd
from sqlalchemy import DateTime, String, Text

# Importerar ORM-delarna:
# - DeclarativeBase: bas-klassen som alla modeller bygger på
# - Mapped: typ-hint som talar om för SQLAlchemy att detta är ett ORM-fält/kolumn
# - mapped_column: funktionen som definierar en kolumn (typ, constraints, default, osv)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# Base-klassen är “startpunkten” för alla dina modeller.
# SQLAlchemy samlar metadata från Base för att kunna skapa tabeller och migrations.
class Base(DeclarativeBase):
    pass


# __tablename__ berättar vilket namn tabellen ska ha i databasen.
# Viktigt: måste matcha om du redan skapat tabellen i DB.
class PrivacyRequest(Base):
    __tablename__ = "privacy_request" # tabellens namn i databasen

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

    # Stad (kan vara tom)
    # city får vara None (valfritt fält).
    # Typen "str | None" betyder att Python kan ha None,
    # och nullable=True säger att DB-kolumnen också får vara NULL.
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)

    # Profil-URL (kan vara tom)
    # profile_url får vara None.
    # Du använder String(200) här: bra för kortare länkar.
    # Om du tror att URLs kan bli längre kan du byta till Text istället.
    profile_url: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Status för ärende (MVP: bara text)
    # status är en enkel status-sträng.
    # default="draft" betyder att om du skapar en rad utan att ange status,
    # så får den automatiskt "draft".
    status: Mapped[str] = mapped_column(String(50), default="draft")

    # När ärendet skapas
    # created_at sparar när ärendet skapades.
    # default=datetime.utcnow betyder att tiden sätts när raden skapas.
    # utcnow används ofta för att slippa tidszonsstrul.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


"""
Snabba “bra-att-veta” notes

Mapped[...] är SQLAlchemy 2.0-sättet att göra modeller “typ-säkra” och tydliga.
nullable=True måste matcha att du tillåter None i typen (str | None), annars blir det inkonsekvent.
Text importeras men används inte just nu — helt okej, men du kan ta bort importen för att hålla filen clean.
"""