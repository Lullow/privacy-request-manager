# Privacy Request Manager — Backend

REST API for a GDPR privacy request tool that helps users get their personal data removed from public data broker sites. The focus was on building a production-quality FastAPI application: async SQLAlchemy, token-based auth, AI-generated emails, and real email delivery with inbound webhook handling.

Frontend lives in [`../frontend`](../frontend).

## What it does

- Register and authenticate users (bcrypt passwords, email verification, server-side session tokens)
- Create privacy requests targeting specific companies/data brokers
- AI-generates a GDPR removal email using Claude (Anthropic) — standard or legal template
- Sends the email directly to the company via Resend
- Tracks request lifecycle: `draft → generated → sent → waiting`
- Sends follow-up reminder emails if a company doesn't respond
- Receives inbound replies via Svix-verified webhook (matched back to the original request by email)
- Background cleanup task removes expired tokens automatically
- Rate limiting on sensitive endpoints (register, send, reminder)
- Checks for unapplied Alembic migrations on startup

## How to run

```
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in the values:

```
DATABASE_URL=postgresql+asyncpg://...
ANTHROPIC_API_KEY=...
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=...
EMAIL_FROM=onboarding@resend.dev
RESEND_WEBHOOK_SECRET=...
CORS_ORIGINS=http://localhost:5173
```

Only `DATABASE_URL` and `ANTHROPIC_API_KEY` are required — the rest have defaults, and leaving the Resend values empty disables outbound mail and webhook signature checks for local development.

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
backend/
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
│   ├── router.py         — register, login, verify email, logout
│   ├── dependencies.py   — token lookup and current-user resolution
│   └── utils.py          — token generation and expiry
├── services/
│   ├── ai_generator.py   — Claude integration for generating GDPR emails
│   ├── email_sender.py   — Resend integration for sending emails
│   └── cleanup.py        — background task for token cleanup
├── migrations/           — Alembic migration scripts
└── tests/                — pytest suite for auth and privacy requests
```

## Authentication

Sessions use opaque tokens, not JWTs. `secrets.token_urlsafe(32)` generates a random token on login, it is stored in the `Token` table against the user with a 30-day expiry, and every authenticated request looks it up there. That trades a database read per request for the ability to revoke a session immediately — a self-contained JWT stays valid until it expires unless you maintain a denylist. Passwords are hashed with bcrypt and never stored in plain text.

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
- bcrypt (password hashing)
- Claude API / Anthropic (AI email generation)
- Resend (email delivery)
- Svix (webhook signature verification)
- slowapi (rate limiting)
- pytest (tests)

---

Built together with Gabriella Roupé for the course *Ramverk i Python* at Teknikhögskolan Stockholm, February–April 2026.
