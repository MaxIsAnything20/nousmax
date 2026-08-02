# StudyForge — Phase 2 (Backend) Plan

Senior-dev plan to take the Phase-1 UI prototype to a working product. Everything
here is built on **free tiers** and the code is written for you — the only manual
steps are creating a few free accounts and pasting keys (see `SETUP.md`), because
account creation and secret keys can't be automated.

## Honest split of work

- **I do (code, 100%):** database schema, row-level security, serverless API,
  file parsing, LLM generation, YouTube transcript/search, the frontend data
  layer, auth wiring, and all deploy configuration.
- **You do (~10 min, no coding):** create the free Supabase + Groq + Vercel
  accounts, paste 5 env values, click Deploy, run one SQL file. Steps in `SETUP.md`.

## The free-tier stack (chosen for zero cost + minimal ops)

| Concern | Choice | Why / free tier |
|---|---|---|
| Hosting (frontend + API) | **Vercel** | Free hobby tier; auto-builds the Vite app; `/api/*` become serverless functions |
| Database | **Supabase Postgres** | Free 500MB DB, generous row limits |
| Auth | **Supabase Auth** | Email + Google OAuth, free |
| File storage | **Supabase Storage** | Free 1GB bucket for uploaded PDFs/DOCX/images |
| LLM (generation) | **Groq** (Llama 3.3 70B) | Free, fast, OpenAI-compatible API; abstracted so Gemini/OpenAI also drop in |
| PDF/DOCX/OCR | `pdf-parse`, `mammoth`, `tesseract.js` | Open-source, run inside the serverless functions |
| YouTube | `youtube-transcript` (no key) + YouTube Data API (free quota) for search | Transcript is keyless; search needs a free key (optional) |

## Architecture

```
 Browser (React app, Vercel static)
   │  Supabase JS SDK  → Auth (login/signup), Storage (upload file), DB reads via RLS
   │  fetch()          → Vercel serverless /api (secrets live here)
   ▼
 /api  (Vercel functions, Node)
   ├─ /api/sources/parse    fetch file from Storage → text → save to sources.content_text
   ├─ /api/sources/youtube  URL → transcript → save source
   ├─ /api/videos/search    topic → YouTube search results
   └─ /api/generate         {sourceId,type} → LLM → save + return quiz/summary/flashcards
   ▼
 Supabase (Postgres + Auth + Storage)  ←  RLS: users only see their own rows
   ▼
 Groq LLM  (server-side, key never touches the browser)
```

## Data model (Postgres — see `supabase/schema.sql`)

- `sources` — id, user_id, kind (`file` | `video`), name, meta, content_text, created_at
- `generations` — id, user_id, source_id, type (`quiz` | `summary` | `flashcards`), payload (jsonb), created_at
- `card_progress` — spaced-repetition state per flashcard (SM-2: ease, interval, due_at) for the "resurface at the right moment" feature
- `study_events` — lightweight log for streaks + a study heatmap

All tables have **row-level security** so a user can only read/write their own rows.

## API endpoints (all require a Supabase JWT except search)

- `POST /api/sources/parse`   `{ sourceId, storagePath }` → extracts text, updates source, returns `{ ready:true }`
- `POST /api/sources/youtube` `{ url }` → fetches transcript → creates source → returns source
- `GET  /api/videos/search?q=` → `[{ id, title, channel, duration, ... }]`
- `POST /api/generate`        `{ sourceId, type }` → LLM → stores + returns the generation payload

Auth (login, signup, Google, session) is handled **directly by the Supabase SDK** in
the browser — no custom auth endpoints needed. The `AuthModal` gets wired to it.

## Frontend wiring (swap the 6 mock seams)

`src/lib/api.js` provides the real implementations. Final connect = replace the
bodies of these functions in `StudyForge.jsx` (signatures stay identical, so the UI
doesn't change):

| Mock (Phase 1) | Real (Phase 2) |
|---|---|
| `mockProcessFile()` | upload to Supabase Storage → `POST /api/sources/parse` |
| `mockFetchTranscript()` | `POST /api/sources/youtube` |
| `mockVideoSearch()` | `GET /api/videos/search` |
| `mockGenerateQuiz/Summary/Flashcards()` | `POST /api/generate` with the type |
| `AuthModal` submit | `supabase.auth.signInWithPassword / signUp / signInWithOAuth` |
| `mockSources` (library) | `select * from sources` via Supabase (RLS) |

This is done at deploy time because it needs the live API URL + Supabase keys.

## Feature roadmap — informed by what the good study tools do

Looking at nkae.study, Aistote, and Quizlet, the features that make these sticky
(and worth adding on top of upload → generate):

1. **Spaced repetition** ("bring it back at the right moment") — SM-2 scheduling on
   flashcards; `card_progress` + a `due` queue. This is nkae's core hook.
2. **Adaptive quizzes** — track wrong answers, re-ask weak items, show explanations
   (we already generate explanations).
3. **Focus/streaks/heatmap** — pomodoro timer + a study calendar heatmap from
   `study_events`. (nkae's "Focus sessions".)
4. **Study sets & sharing** — public share links for a generated set.
5. **Summaries with key-point highlighting** and export (PDF/Anki).

Phase 2 ships items 1–3 as the schema is already laid out for them; 4–5 are fast follows.

## Detailed task list

1. ✅ Fix auth modal centering.
2. ✅ Phase-2 plan + `SETUP.md`.
3. DB schema + RLS + storage bucket (`supabase/schema.sql`).
4. LLM provider abstraction (`api/_lib/llm.js`, Groq default, JSON-mode prompts).
5. Auth helper to verify Supabase JWT server-side (`api/_lib/auth.js`).
6. `POST /api/generate` — quiz / summary / flashcards.
7. `POST /api/sources/parse` — PDF/DOCX/image → text.
8. `POST /api/sources/youtube` — transcript ingest.
9. `GET /api/videos/search` — YouTube search.
10. Frontend data layer (`src/lib/api.js`) + Supabase client.
11. Wire the 6 mock seams + AuthModal (at deploy, with live keys).
12. `vercel.json`, `.env.example`, package deps.
13. Spaced-repetition scheduler + focus/heatmap (roadmap items 1–3).

## Deployment (summary — full steps in SETUP.md)

1. Create Supabase project → run `supabase/schema.sql` → create a public Storage bucket `sources`.
2. Create a Groq API key (free).
3. Import the GitHub repo into Vercel → set env vars → Deploy.
4. (optional) Enable Google OAuth in Supabase; add a YouTube Data API key for search.
