# Privacy Request Manager — Frontend

React frontend for a GDPR privacy request tool that helps users get their personal data removed from public data broker sites.

Built together with Gabriella during the course *Ramverk i Python* (Feb–Apr 2026).

**Backend repo:** [Lullow/prm-backend](https://github.com/Lullow/prm-backend) (private)

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
npm run dev
```

Requires the backend API running locally or a configured `VITE_API_URL` in `.env`.

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

## Tech

- React
- Vite
- JavaScript (JSX)

## Reflection

This was the first time I built a full-stack project with a proper separation between frontend and backend. Working with JWT auth, protected routes, and async API calls across a real codebase was a big step up from previous labs.
