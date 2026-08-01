# StudyForge — Phase 1 (Frontend / UI-UX prototype)

> Working name — swap later. **This phase is UI/UX only.** Every place that would
> call a real service uses a clearly-labeled **mock** function returning fake data.
> No backend, database, auth, YouTube API, file parsing, or LLM calls exist here.
> Phase 2 plugs real services into these seams.

## What this is

A dark-first (with fully-designed light mode) personal study web app that turns a
user's material into study tools. Single source hub → generate quizzes, summary
notes, and flashcards from one place. Built as a single self-contained React
component (`StudyForge.jsx`), animated throughout, with a first-run guided tour.

## Screens

- **Landing / Hero** — animated hero, scroll-revealed "How it works" (4 steps),
  feature grid, gradient CTA.
- **Onboarding** — first-run welcome modal + skippable 4-step spotlight tour that
  points at real workspace elements, with a progress bar.
- **Workspace** — source panel with three tabs (Upload file / Paste YouTube /
  Search topic), drag-and-drop, fake processing → "source ready" state, and a
  Generate panel (Quiz / Summary / Flashcards) that unlocks once a source is ready.
- **YouTube search** — query input → grid of mock video cards; picking one sets it
  as the active source.
- **Output views** — interactive Quiz (take mode, submit, auto-graded results +
  explanations, retake), structured Summary Notes, and flip-card Flashcards with
  progress + "learned" tracking.
- **Global UI** — sticky nav with logo + theme toggle + Library drawer (mock past
  sources), loading skeletons, teaching empty states, responsive down to mobile.

## Theme & motion

- Deep charcoal/navy dark base, **electric violet + cyan** accents (used sparingly).
- Light/dark toggle in the nav (sun/moon). Both themes fully designed.
- Theme + "seen tour" held in **React state** (see comments) — Phase 2 will persist
  these (localStorage is unavailable in the prototype environment).
- Scroll-reveal (IntersectionObserver), hover micro-interactions, flip animation,
  spotlight tour, shimmer skeletons — all via a single injected `<style>` block.

## Mock seams for Phase 2

All mocks live at the top of `StudyForge.jsx` in one block. Swap the **bodies**
(not the signatures) for real services:

| Mock | Replace with (Phase 2) |
|---|---|
| `mockProcessFile(fileName)` | real upload + PDF/DOCX/image extraction |
| `mockFetchTranscript(url)` | real YouTube ingest + transcript fetch |
| `mockVideoSearch(query)` | real topic → video search |
| `mockGenerateQuiz()` | LLM quiz generation over the source |
| `mockGenerateSummary()` | LLM summary generation |
| `mockGenerateFlashcards()` | LLM flashcard generation |
| `mockSources` / `mockQuiz` / `mockSummary` / `mockFlashcards` | live data from the backend |

Each async mock includes a short artificial delay so loading states stay visible
and designable.

## Explicitly out of scope for Phase 1

No real file parsing · no YouTube Data API / transcripts · no AI/LLM calls ·
no backend, database, auth or accounts · no API keys.

## Run

Drop `StudyForge.jsx` into any React 18+ app (Vite/CRA/Next) as a route/page. It
uses `lucide-react` for icons and injects its own CSS — no Tailwind config needed.

```bash
npm i lucide-react
```
