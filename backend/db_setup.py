# asyncio behövs för att kunna köra async-kod (await) i ett vanligt Python-script
import asyncio

# Vi importerar vår SQLAlchemy engine (den som vet hur man ansluter till databasen)
from connect_db import engine

# Vi importerar Base, som innehåller all metadata om dina modeller/tabeller
# (t.ex. PrivacyRequest-tabellen ligger registrerad i Base.metadata)
from models import Base


# En async-funktion som skapar tabeller i databasen
async def init_db():
    # Skapar alla tabeller som finns definierade i Base.metadata.
    # engine.begin() öppnar en "transaction scope" (en transaktion).
    # async with gör att den stängs automatiskt och committas/avslutas korrekt.
    async with engine.begin() as conn:

        # run_sync(...) används för att köra en "sync-funktion" (create_all)
        # fast vi är i en async-anslutning.
        # Base.metadata.create_all skapar tabeller om de inte redan finns.
        # Den skapar INTE migrationshistorik och den tar inte bort tabeller.
        await conn.run_sync(Base.metadata.create_all)


# Den här checken gör att koden bara körs när du kör filen direkt:
#   python db_setup.py
# men inte om du importerar den från någon annanstans.
if __name__ == "__main__":

    # Startar en event loop och kör init_db() (som är async).
    asyncio.run(init_db())


"""
Mini-sammanfattning

Syfte: Skapa tabellerna i databasen baserat på dina modeller (via Base.metadata).
När man använder den: I början av projektet (MVP), eller i dev när du vill skapa tabeller snabbt.
Viktigt: create_all() är inte en ersättning för Alembic migrations.
När du börjar ändra databasstruktur “på riktigt” (lägga till kolumner, ändra typer, osv) är Alembic vägen.
"""