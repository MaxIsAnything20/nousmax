# NousMax

**An AI-powered study platform that turns notes, PDFs, and YouTube lectures into quizzes, summaries, and flashcards — then keeps students coming back with streaks, daily goals, and a global leaderboard.**

🔗 **Live:** [nousmax.study](https://nousmax.study)  ·  💻 **Source:** [github.com/MaxIsAnything20/nousmax](https://github.com/MaxIsAnything20/nousmax)

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)

---

## Overview

NousMax is a full-stack web application I designed, built, and shipped end to end — from the marketing landing page to the AI generation pipeline, user accounts, and a live subscription billing system. A student drops in their own material (typed notes, an uploaded PDF, or a YouTube link) and NousMax generates the study tools they'd otherwise spend hours making by hand: auto-graded quizzes with explanations, structured summary notes, and flip-card flashcards. Progress is tracked with study streaks, a daily goal, achievement badges, and a global leaderboard to keep motivation high.

It runs in production on a custom domain, backed by a real database with row-level security, Google and email authentication, and a payment system that upgrades accounts automatically the moment a subscription is purchased.

## What it does

**Turn any source into study material.** Free users can paste in their own notes; Pro users can additionally upload PDFs or drop in a YouTube link, and NousMax extracts the content before generating from it.

**Study three ways.** Every source can be turned into an interactive quiz (take it, submit, get auto-graded results with per-question explanations, and retake), a set of comprehensive summary notes, or an endless deck of flip-card flashcards with "learned" tracking.

**Stay motivated.** A personal profile page shows a study-streak counter, an activity calendar, lifetime stats, earned badges, and a saved library of past study sets. A daily study goal and a global leaderboard turn solo studying into something with momentum.

**Free and Pro tiers.** Free accounts get a daily generation allowance and paste-based input; Pro unlocks PDF and YouTube import and removes the daily cap. Billing is handled through a Merchant-of-Record so tax and compliance are handled automatically.

## Architecture

NousMax is a Next.js App Router application deployed on Vercel. The landing page is served as a static asset for a fast first paint, while the authenticated app runs as React routes talking to a set of serverless API routes.

**Authentication and data** run on Supabase — Postgres for storage, plus Google OAuth and email/password sign-in. Every table is protected by row-level security policies (`auth.uid() = user_id`), so a user can only ever read or write their own rows, enforced at the database layer rather than in application code. The leaderboard is exposed through a security-definer function so it can aggregate across users without ever leaking private data.

**The AI pipeline** calls Google Gemini through a multi-model fallback chain: if the primary model is rate-limited or unavailable, the request automatically cascades through several backup models before failing. This makes generation resilient to the transient quota errors that would otherwise break a single-model setup. Responses are parsed as structured JSON so the frontend can render quizzes, summaries, and flashcards reliably.

**Payments** are handled by Lemon Squeezy as Merchant of Record. Checkout passes the signed-in user's ID through as custom checkout data; when the purchase completes, Lemon Squeezy calls a webhook that verifies an HMAC signature (constant-time comparison) before using a service-role client to flip the account to Pro. The full flow — checkout → signed webhook → database update → unlocked features — is verified working end to end.

## Security

Security was treated as a first-class concern rather than an afterthought:

- **Row-level security** on every table, so data isolation is enforced by Postgres, not by hopeful application logic.
- **PKCE OAuth flow** instead of the implicit flow, so authentication codes are single-use and short-lived and sessions can't leak through shared URLs.
- **HMAC-verified webhooks** with constant-time signature comparison, so only genuine Lemon Squeezy events can modify billing state.
- **Hardened HTTP headers** — `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- **Server-side rate limiting** on anonymous generation requests to blunt abuse of the AI endpoint, plus sanitized error responses that never expose internal details to clients.
- **Secrets** kept entirely in environment variables; the service-role key never reaches the browser.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18 |
| Hosting | Vercel (serverless functions, custom domain) |
| Database & Auth | Supabase (Postgres, Row-Level Security, Google OAuth + email/password) |
| AI | Google Gemini (multi-model fallback, structured JSON output) |
| Payments | Lemon Squeezy (Merchant of Record, HMAC-signed webhooks) |
| Language | JavaScript, SQL |

## Running locally

```bash
cd nousmax-app
npm install
npm run dev
```

Create a `.env.local` from `.env.example` and provide your own Supabase, Google Gemini, and Lemon Squeezy credentials. The app runs at `http://localhost:3000`.

## About

Built by **Maxwell Gyampoh** — designed, engineered, and shipped solo, covering the full stack from UI and animation through the AI pipeline, database security, and live subscription billing.

- GitHub: [@MaxIsAnything20](https://github.com/MaxIsAnything20)
- Email: gyampohmaxwelljr@gmail.com
