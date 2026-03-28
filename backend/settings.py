from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Read values from a .env file as well as real environment variables.
    # extra="ignore" prevents validation errors for unrecognised .env keys.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    ANTHROPIC_API_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "onboarding@resend.dev"
    EMAIL_REPLY_TO: str | None = None

    # Comma-separated list of allowed CORS origins, e.g. "http://localhost:5173,https://app.example.com"
    CORS_ORIGINS: str = ""

    # Controls the root log level. Override with LOG_LEVEL=DEBUG in .env for verbose output.
    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        # Split the comma-separated string and strip whitespace.
        # Empty strings are filtered out so a blank CORS_ORIGINS value
        # results in an empty list rather than a list with one empty string.
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
