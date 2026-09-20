# Privacy Request Manager

A GDPR tool that helps people get their personal data removed from public data broker sites.

Swedish data brokers publish home addresses, phone numbers, ages and household members of private individuals, and getting that removed means writing a formal request to each one. This app does it for you: pick a company, fill in a short form, and the backend generates a GDPR removal request with Claude, sends it by email, tracks the reply, and follows up if the company goes quiet.

The project is full-stack — a React single-page app talking to an async FastAPI service over PostgreSQL.

## Layout

```
backend/    FastAPI service — API, database, AI generation, email delivery
frontend/   React SPA — landing page, auth, multi-step request form, dashboard
```

Each half has its own README with setup instructions, structure and endpoint list.

## How it works

1. The user registers and confirms their address through an email verification link.
2. They create a privacy request: which company, which personal details to reference, and what tone the letter should take.
3. The backend sends the request to Claude, which drafts a GDPR removal email — either a standard or a more formal legal template.
4. The user reviews the draft in the dashboard before anything is sent.
5. On send, the email goes out through Resend, and the request moves through `draft → generated → sent → waiting`.
6. Replies from the company arrive back as inbound webhooks, are signature-verified with Svix, and are matched to the original request.
7. If a company does not answer, the user can trigger a follow-up reminder.

## Running it

The two halves run separately. Start the backend first:

```
cd backend
pip install -r requirements.txt
cp .env.example .env     # then fill in the values
alembic upgrade head
uvicorn main:app --reload
```

Then the frontend:

```
cd frontend
npm install
npm run dev
```

The API serves interactive docs at `http://localhost:8000/docs`, and the frontend expects `VITE_API_URL` to point at it.

## Tech

**Backend** — Python 3, FastAPI (async), SQLAlchemy 2.0 (async), PostgreSQL + asyncpg, Alembic, bcrypt, Anthropic Claude API, Resend, Svix, slowapi, pytest

**Frontend** — React 19, Vite 7, React Router 7, plain JavaScript (JSX)

## Notes on the design

**Authentication** uses opaque session tokens rather than JWTs. On login the server generates a random 32-byte token with `secrets.token_urlsafe`, stores it against the user with a 30-day expiry, and looks it up on each request. It costs a database read per call, but it means a session can actually be revoked server-side — which a self-contained JWT cannot do without adding a denylist. Passwords are stored as bcrypt hashes and never in plain text.

**Rate limiting** sits on the endpoints that cost money or send mail: registration, send and reminder.

**Inbound email** is matched back to the originating request by the address it was sent from, which is why each request tracks the exact recipient it used.

---

Built by Elia Cherrou and Gabriella Roupé as the course project for *Ramverk i Python* at Teknikhögskolan Stockholm, February–April 2026.
