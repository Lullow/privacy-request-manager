# Privacy Request Manager — Frontend

React single-page app for a GDPR privacy request tool that helps users get their personal data removed from public data broker sites.

Backend lives in [`../backend`](../backend).

## What it does

- Landing page explaining the product
- User registration, login, and email verification flow
- Multi-step form to create a privacy request (target company, personal details, tone)
- Dashboard to manage all active requests and track their status
- View AI-generated emails before sending
- Notification bell for inbound replies from companies
- Resources and information pages about GDPR rights

## How to run

```
npm install
cp .env.example .env
npm run dev
```

`VITE_API_BASE_URL` must point at a running backend — see [`../backend`](../backend) for how to start one.

## Structure

```
src/
├── pages/          — full page views (Dashboard, Form, Login, etc.)
├── components/     — reusable UI components (TopBar, StepIndicator, etc.)
├── api/            — API call functions
├── context/        — React context (auth state, etc.)
├── hooks/          — custom hooks
├── utils/          — helper functions
└── data/           — static data
```

The user-facing copy is in Swedish, since the tool targets Swedish data brokers.

## Tech

- React 19
- Vite 7
- React Router 7
- JavaScript (JSX)

## Reflection

This was the first time I built a full-stack project with a proper separation between frontend and backend. Handling token-based auth, protected routes and async API calls across a real codebase was a big step up from previous labs.

---

Built together with Gabriella Roupé for the course *Ramverk i Python* at Teknikhögskolan Stockholm, February–April 2026.
