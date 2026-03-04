# asyncio används för att kunna köra async-kod (dvs await) i ett vanligt Python-script.
# Det ger oss event loop + möjligheten att köra async-funktioner från terminalen.
import asyncio

# Vi importerar engine från connect_db.py.
# engine är vår "anslutningsmotor" som vet vilken databas vi ska koppla upp oss mot.
from connect_db import engine

# text() används för att köra "rå SQL" (raw SQL) med SQLAlchemy.
# Bra för små test-kommandon som "SELECT 1" för att testa att DB-kopplingen funkar.
from sqlalchemy import text


# En async-funktion (måste vara async eftersom vi använder await inuti).
async def main():
    # engine.connect() öppnar en anslutning till databasen.
    # async with gör att anslutningen stängs automatiskt när vi lämnar blocket.
    async with engine.connect() as conn:
        # conn.execute(...) kör en SQL-sats på databasen.
        # await behövs eftersom det är en async-operation.
        # text("SELECT 1") betyder: kör SQL som bara returnerar siffran 1.
        result = await conn.execute(text("SELECT 1"))

        # result.scalar() hämtar "första värdet" från första raden i resultatet.
        # I det här fallet ska det bli 1.
        print(result.scalar())


# asyncio.run(main()) startar en event loop och kör din async-funktion main().
# Det är standard-sättet att köra async-kod i ett vanligt Python-script.
asyncio.run(main())


"""
Mini-sammanfattning (vad den här filen är till för)

Syfte: Snabb “ping” till databasen.
Vad den bevisar: att engine + DATABASE_URL funkar, och att du kan köra en query.
Förväntad output: 1
"""