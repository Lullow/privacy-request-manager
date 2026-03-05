# Importerar verktyg från pydantic-settings:
# - BaseSettings: bas-klass som automatiskt läser in värden från miljövariabler / .env
# - SettingsConfigDict: sättet man konfigurerar BaseSettings i Pydantic v2
from pydantic_settings import BaseSettings, SettingsConfigDict


@property
def cors_origins_list(self) -> list[str]:
    return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

# Skapar en klass som samlar all "config" för projektet
# (databas-URL, CORS-origins, osv)
class Settings(BaseSettings):
    # model_config styr hur Settings ska bete sig:
    # - env_file=".env" betyder: läs även från en .env-fil (förutom vanliga env vars)
    # - extra="ignore" betyder: om det finns fler variabler i .env än vi definierat här,
    #   så ignoreras de istället för att kasta error.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # DATABASE_URL: str innebär att Settings kräver att DATABASE_URL finns i .env eller env vars.
    # Om den saknas får du ett validation error när Settings() skapas.
    DATABASE_URL: str  # type annotation

    # Den här raden betyder: om CORS_ORIGIONS inte finns i .env så används defaulten.
    # Din frontend kör på http://localhost:5173 och din backend på http://localhost:8000. Webbläsaren blockerar som standard requests mellan olika "origins" (adresser).
    # Om du inte sätter CORS_ORIGINS skulle webbläsaren blockera alla requests från din frontend till din backend.
    # Pydantic vet att den ska leta efter cors_origin för att se vilken port som frontend ska köra på
    CORS_ORIGINS: str = "http://localhost:5173"

    # @property gör att du kan använda settings.cors_origins_list som en "vanlig variabel"
    # trots att det egentligen är en funktion som körs varje gång du läser den.
    @property
    def cors_origins_list(self) -> list[str]:
        # tillåter att du senare kan skriva flera origins separerade med kommatecken
        # Här tar vi en sträng (ex: "http://localhost:5173,http://localhost:3000")
        # och gör om den till en lista:
        # ["http://localhost:5173", "http://localhost:3000"]
        #
        # .split(",") delar upp på kommatecken
        # .strip() tar bort mellanslag runt varje origin
        # I verkligheten kan du ha flera frontend-adresser som behöver prata med din backend, därav behöver det bli en lista
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Vi skapar en global instans av Settings så du kan importera den överallt:
# from settings import settings
# och sedan använda settings.DATABASE_URL, settings.cors_origins_list, osv.
settings = Settings()


"""
Mini-sammanfattning

Vad filen gör: Läser in projektets konfiguration från .env/miljövariabler via Pydantic.
Var den används: I t.ex. connect_db.py för DATABASE_URL och i main.py för CORS.
Varför propertyn finns: FastAPI's CORS vill ofta ha en lista av origins, men du vill skriva det enkelt i .env som en sträng.
"""
