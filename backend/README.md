# Privacy Request Manager — Backend

REST API backend for a GDPR privacy request tool that helps users get their personal data removed from public data broker sites.

This was built together with Gabriella during the course *Ramverk i Python* (Feb–Apr 2026). The focus was on building a production-quality FastAPI application with async SQLAlchemy, JWT auth, AI-generated emails, and real email delivery via webhook integration.

## What it does

- Register and authenticate users (JWT tokens, bcrypt passwords, email verification)
- Create privacy requests targeting specific companies/data brokers
- AI-generates a GDPR removal email using Claude (Anthropic) — standard or legal template
- Sends the email directly to the company via Resend
- Tracks request lifecycle: `draft → generated → sent → waiting`
- Sends follow-up reminder emails if a company doesn't respond
- Receives inbound replies via Svix webhook (matched back to the original request by email)
- Background cleanup task removes expired tokens automatically
- Rate limiting on sensitive endpoints (register, send, reminder)
- Checks for unapplied Alembic migrations on startup

## How to run

```
pip install -r requirements.txt
```

Create a `.env` file (see `.env.example` for required variables):
```
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=...
ANTHROPIC_API_KEY=...
RESEND_API_KEY=...
SVIX_SECRET=...
CORS_ORIGINS=http://localhost:5173
```

Run migrations:
```
alembic upgrade head
```

Start the API:
```
uvicorn main:app --reload
```

Interactive docs at `http://localhost:8000/docs`

## Structure

```
prm_backend/
├── main.py               — app setup, lifespan, middleware
├── models.py             — SQLAlchemy models (User, PrivacyRequest, Message, InboundMessage, Token)
├── schemas.py            — Pydantic request/response models
├── settings.py           — environment config via pydantic-settings
├── connect_db.py         — async database engine and session
├── limiter.py            — slowapi rate limiter setup
├── api/
│   ├── routers.py        — privacy request endpoints (CRUD, generate, send, reminder)
│   └── webhooks.py       — inbound email webhook handler (Svix)
├── auth/
│   └── router.py         — register, login, verify email, logout
├── services/
│   ├── ai_generator.py   — Claude integration for generating GDPR emails
│   ├── email_sender.py   — Resend integration for sending emails
│   └── cleanup.py        — background task for token cleanup
└── migrations/           — Alembic migration scripts
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get token |
| GET | `/api/auth/verify` | Verify email address |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/privacy-requests` | Create a privacy request |
| GET | `/api/privacy-requests` | List all requests for current user |
| GET | `/api/privacy-requests/{id}` | Get a specific request |
| PUT | `/api/privacy-requests/{id}` | Update request status |
| DELETE | `/api/privacy-requests/{id}` | Delete a request |
| POST | `/api/privacy-requests/{id}/generate` | Generate AI email |
| GET | `/api/privacy-requests/{id}/messages` | List generated messages |
| POST | `/api/privacy-requests/{id}/send` | Send email to company |
| POST | `/api/privacy-requests/{id}/reminder` | Send follow-up reminder |
| POST | `/api/webhooks/inbound` | Receive inbound email replies |

## Tech

- Python 3
- FastAPI (async)
- SQLAlchemy 2.0 (async)
- PostgreSQL + asyncpg
- Alembic (migrations)
- bcrypt + JWT (auth)
- Claude API / Anthropic (AI email generation)
- Resend (email delivery)
- Svix (webhook signature verification)
- slowapi (rate limiting)
- pytest (tests)
