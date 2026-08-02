# StudyForge — Setup (the ~10-minute human part)

All the code is done. These are the only steps that need a human, because they
create accounts and secret keys (which can't be automated). No coding required —
just copy/paste. Everything below is **free**.

## 1) Supabase (database + auth + file storage) — ~4 min

1. Go to https://supabase.com → sign up → **New project** (free tier). Pick a name + password.
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
3. **Storage** → **New bucket** → name it `sources` → make it Private → Create.
4. **Project Settings → API**, copy these three:
   - `Project URL`  → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE` (⚠️ secret — server only)
5. (optional) **Authentication → Providers → Google** → enable + paste a Google OAuth
   client (Google Cloud console, free) if you want "Continue with Google".

## 2) Groq (the free LLM) — ~2 min

1. Go to https://console.groq.com → sign up (free).
2. **API Keys → Create API Key** → copy it → `GROQ_API_KEY`.

## 3) (optional) YouTube search key — ~2 min

Only needed for the "Search a topic" tab (transcript ingest works without it).
1. https://console.cloud.google.com → new project → **APIs & Services → Library** →
   enable **YouTube Data API v3** → **Credentials → API key** → copy → `YOUTUBE_API_KEY`.

## 4) Vercel (hosting) — ~3 min

1. Go to https://vercel.com → sign up **with GitHub** → **Add New → Project** →
   import `MaxIsAnything20/studyforge`.
2. Framework preset: **Vite** (auto-detected). Leave build settings default.
3. **Environment Variables** — add these (values from steps 1–3):

   ```
   SUPABASE_URL            = ...
   SUPABASE_ANON_KEY       = ...
   SUPABASE_SERVICE_ROLE   = ...      (secret)
   GROQ_API_KEY            = ...      (secret)
   YOUTUBE_API_KEY         = ...      (optional)
   VITE_SUPABASE_URL       = same as SUPABASE_URL
   VITE_SUPABASE_ANON_KEY  = same as SUPABASE_ANON_KEY
   ```
   (The `VITE_` ones are exposed to the browser for auth/storage — that's expected and
   safe; the anon key is public by design. The service-role and Groq keys stay server-only.)
4. **Deploy.** You'll get a live URL like `https://studyforge.vercel.app`.

That's it — the app is live with real auth, uploads, and AI generation.

## Notes

- The `anon` key is meant to be public; Supabase **row-level security** (in the schema)
  is what actually protects data. The `service_role` and `GROQ_API_KEY` are only ever
  used inside `/api` serverless functions, never shipped to the browser.
- Free-tier limits are generous for personal use. Groq has daily token limits; if you
  hit them, swap `LLM_PROVIDER`/keys in `api/_lib/llm.js` (Gemini/OpenAI-compatible).
- Local dev: `npm install` then `vercel dev` (runs the Vite app + `/api` together).
