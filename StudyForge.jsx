import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun, Moon, Sparkles, Upload, Youtube, Search, FileText, Layers,
  BrainCircuit, ArrowRight, Check, X, ChevronLeft, ChevronRight,
  RotateCw, Play, GraduationCap, Zap, Library, Plus, CheckCircle2,
  Loader2, RefreshCw, Trophy, Lightbulb, ListChecks, StickyNote,
  Clock, FileUp, MousePointerClick, ChevronDown, ArrowDown,
  Volume2, Send, Flame, Pause, TrendingUp, MessageSquare, Share2, Timer, Target, Image, Mic, Link2,
  Pencil,
} from "lucide-react";

/* =========================================================================
   StudyForge — Phase 1 (UI/UX ONLY)  ·  Working name, swap later.
   -------------------------------------------------------------------------
   IMPORTANT — this is a FRONTEND-ONLY prototype. Every place that would
   talk to a real service instead calls a clearly-labeled mock (see the
   MOCK DATA MODULE below). No backend, DB, auth, YouTube API, file parsing
   or LLM calls exist here. Phase 2 plugs real services into these seams.
   ========================================================================= */


/* =========================================================================
   1) MOCK DATA MODULE  —  the single place Phase 2 will replace.
   Each async fn simulates latency so loading states are designable.
   Swap the bodies (not the signatures) for real services in Phase 2.
   ========================================================================= */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// -- seed sources (a couple of files + a video) for the "Library" ----------
const mockSources = [
  { id: "s1", kind: "file", name: "Organic Chemistry — Ch. 7.pdf", meta: "PDF · 24 pages", addedAt: "2d ago" },
  { id: "s2", kind: "file", name: "Cell Biology Lecture Notes.docx", meta: "DOCX · 11 pages", addedAt: "5d ago" },
  { id: "s3", kind: "video", name: "The French Revolution, Explained", meta: "YouTube · 14:22", addedAt: "1w ago" },
];

// -- a realistic generated quiz --------------------------------------------
const mockQuiz = {
  title: "Quiz · Photosynthesis Fundamentals",
  questions: [
    {
      id: "q1", type: "mcq",
      prompt: "Which organelle is the primary site of photosynthesis?",
      options: ["Mitochondrion", "Chloroplast", "Ribosome", "Golgi apparatus"],
      answer: 1,
      explanation: "Chloroplasts contain chlorophyll and the thylakoid membranes where the light reactions occur.",
    },
    {
      id: "q2", type: "tf",
      prompt: "The light-dependent reactions produce glucose directly.",
      options: ["True", "False"],
      answer: 1,
      explanation: "The light reactions produce ATP and NADPH; glucose is built later in the Calvin cycle.",
    },
    {
      id: "q3", type: "mcq",
      prompt: "What gas is released as a by-product of the light reactions?",
      options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Methane"],
      answer: 2,
      explanation: "Water is split (photolysis), releasing O₂ as a by-product.",
    },
    {
      id: "q4", type: "short",
      prompt: "In one sentence, state where the Calvin cycle takes place.",
      answer: "In the stroma of the chloroplast.",
      explanation: "The Calvin cycle (light-independent reactions) occurs in the fluid-filled stroma.",
    },
  ],
};

// -- structured study notes -------------------------------------------------
const mockSummary = {
  title: "Summary Notes · Photosynthesis Fundamentals",
  readingTime: "4 min read",
  sections: [
    {
      heading: "Big Picture",
      body: "Photosynthesis converts light energy into chemical energy stored in glucose. It happens in two linked stages: the light-dependent reactions and the Calvin cycle.",
      points: [
        "Occurs mainly in the leaves, inside chloroplasts.",
        "Overall equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.",
      ],
    },
    {
      heading: "Light-Dependent Reactions",
      body: "These take place in the thylakoid membranes and require direct light.",
      points: [
        "Chlorophyll absorbs light, exciting electrons.",
        "Water is split (photolysis), releasing O₂.",
        "Products: ATP and NADPH, which power the next stage.",
      ],
    },
    {
      heading: "The Calvin Cycle",
      body: "Light-independent reactions in the stroma that fix carbon into sugar.",
      points: [
        "CO₂ is fixed by the enzyme RuBisCO.",
        "ATP and NADPH from stage one drive sugar synthesis.",
        "Output: G3P, later assembled into glucose.",
      ],
    },
    {
      heading: "Why It Matters",
      body: "Photosynthesis underpins nearly all food chains and produces the oxygen most life depends on.",
      points: [],
    },
  ],
};

// -- flashcard deck ---------------------------------------------------------
const mockFlashcards = {
  title: "Flashcards · Photosynthesis Fundamentals",
  cards: [
    { id: "f1", front: "Where does photosynthesis occur?", back: "In the chloroplasts of plant cells, mainly in the leaves." },
    { id: "f2", front: "What are the two main stages?", back: "The light-dependent reactions and the Calvin cycle." },
    { id: "f3", front: "What do the light reactions produce?", back: "ATP and NADPH — plus oxygen as a by-product." },
    { id: "f4", front: "What enzyme fixes carbon in the Calvin cycle?", back: "RuBisCO." },
    { id: "f5", front: "Overall word equation?", back: "Carbon dioxide + water + light → glucose + oxygen." },
  ],
};

// -- topic → video search results ------------------------------------------
const VIDEO_POOL = [
  { id: "v1", title: "Photosynthesis: Crash Course Biology", channel: "CrashCourse", duration: "13:14", views: "9.2M", tone: "#4f46e5" },
  { id: "v2", title: "How Plants Make Food — Full Lesson", channel: "Amoeba Sisters", duration: "8:41", views: "4.1M", tone: "#06b6d4" },
  { id: "v3", title: "The Calvin Cycle, Step by Step", channel: "Prof. Dave Explains", duration: "11:02", views: "1.7M", tone: "#4f7cff" },
  { id: "v4", title: "Light Reactions Made Simple", channel: "Bozeman Science", duration: "9:58", views: "980K", tone: "#22d3ee" },
  { id: "v5", title: "Photosynthesis in 5 Minutes", channel: "StudyQuick", duration: "5:12", views: "2.3M", tone: "#3b82f6" },
  { id: "v6", title: "Chloroplast Structure & Function", channel: "MedBio", duration: "7:33", views: "640K", tone: "#0ea5e9" },
];

// Phase 2 seam: when deployed with a backend, main.jsx sets globalThis.SF_API
// (from src/lib/api.js) and these delegate to the real endpoints. In the static
// preview SF_API is undefined, so the mocks run. Signatures are unchanged.
async function mockVideoSearch(query) {
  if (globalThis.SF_API) return globalThis.SF_API.videoSearch(query);
  await wait(900);
  return VIDEO_POOL.map((v) => ({ ...v, title: v.title }));
}

async function mockProcessFile(fileOrName) {
  if (globalThis.SF_API) return globalThis.SF_API.processFile(fileOrName);
  await wait(1600);
  const name = (fileOrName && fileOrName.name) || fileOrName;
  return { id: "up_" + Date.now(), kind: "file", name, meta: "Processed · ready", addedAt: "just now" };
}

async function mockFetchTranscript(url) {
  if (globalThis.SF_API) return globalThis.SF_API.fetchTranscript(url);
  await wait(1400);
  return { id: "yt_" + Date.now(), kind: "video", name: "Pasted video · ready", meta: "YouTube · transcript ready", addedAt: "just now" };
}

async function mockGenerateQuiz(sourceId) {
  if (globalThis.SF_API) return globalThis.SF_API.generateQuiz(sourceId);
  await wait(1500); return mockQuiz;
}
async function mockGenerateSummary(sourceId) {
  if (globalThis.SF_API) return globalThis.SF_API.generateSummary(sourceId);
  await wait(1300); return mockSummary;
}
async function mockGenerateFlashcards(sourceId) {
  if (globalThis.SF_API) return globalThis.SF_API.generateFlashcards(sourceId);
  await wait(1200); return mockFlashcards;
}


/* =========================================================================
   2) THEME + MOTION — dark-first, light toggle held in React state.
   (Phase 2 note: persist theme choice; localStorage is unavailable here.)
   ========================================================================= */
const CSS = `
:root{ --r:16px; }
.sf{ --bg:#16151d; --bg2:#1d1c26; --surface:#252330; --surface2:#2d2b39;
  --hover:#38364a; --border:rgba(226,222,255,.09); --border2:rgba(226,222,255,.15);
  --text:#f1eff7; --muted:#a9a4b8; --faint:#6f6a7e;
  --primary:#6d5efc; --primary2:#9a8dff; --accent:#8b7cff; --accent2:#b3a8ff;
  --grad:linear-gradient(155deg,#7367f8,#5a4be6); --glow:rgba(109,94,252,.26);
  --shadow:0 26px 70px -26px rgba(6,4,16,.72); --danger:#f87171; --ok:#34d399;
  --amber:#f4c25a; --amber2:#f9d98a; --cream:#f4f1ea; --cream-ink:#1c1b23; --cream-muted:#5c5766;
  color-scheme:dark;
}
.sf.light{ --bg:#f5f3ee; --bg2:#ece8df; --surface:#ffffff; --surface2:#f5f2ea;
  --hover:#efeae0; --border:rgba(40,30,80,.10); --border2:rgba(40,30,80,.16);
  --text:#1c1b23; --muted:#5c5766; --faint:#8b8494;
  --primary:#5b4fe0; --primary2:#4a3fce; --accent:#7d6ffb; --accent2:#9a8dff;
  --grad:linear-gradient(155deg,#6155e8,#4f43d6); --glow:rgba(91,79,224,.2);
  --shadow:0 24px 60px -28px rgba(40,30,90,.3);
  --amber:#c98a1e; --amber2:#e0a83a; --cream:#f4f1ea; --cream-ink:#1c1b23; --cream-muted:#5c5766;
  color-scheme:light;
}
.sf{ background:var(--bg); color:var(--text); min-height:100vh;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased; transition:background .5s ease,color .35s ease; }
.sf *{ box-sizing:border-box; }
.sf ::selection{ background:var(--primary); color:#fff; }

/* layout helpers */
.sf .wrap{ max-width:1120px; margin:0 auto; padding:0 22px; }
.sf .row{ display:flex; align-items:center; }
.sf .gap8{ gap:8px;} .sf .gap12{gap:12px;} .sf .gap16{gap:16px;} .sf .gap24{gap:24px;}
.sf .grid{ display:grid; }
.sf .muted{ color:var(--muted);} .sf .faint{color:var(--faint);}
.sf .center{ text-align:center; }
.sf .pill{ display:inline-flex; align-items:center; gap:7px; padding:6px 13px; border-radius:999px;
  border:1px solid var(--border2); background:var(--surface); font-size:12.5px; color:var(--muted); }
.sf .grad-text{ background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }

/* buttons */
.sf .btn{ display:inline-flex; align-items:center; justify-content:center; gap:9px;
  font-weight:600; font-size:15px; border-radius:12px; padding:12px 20px; cursor:pointer;
  border:1px solid transparent; transition:transform .18s ease, box-shadow .25s ease, background .25s ease, border-color .2s; }
.sf .btn:active{ transform:translateY(1px) scale(.99); }
.sf .btn-primary{ background:var(--grad); color:#fff; box-shadow:0 10px 30px -8px var(--glow); }
.sf .btn-primary:hover{ transform:translateY(-2px); box-shadow:0 16px 40px -8px var(--glow); }
.sf .btn-ghost{ background:var(--surface); color:var(--text); border-color:var(--border2); }
.sf .btn-ghost:hover{ background:var(--hover); transform:translateY(-1px); }
.sf .btn-sm{ padding:9px 15px; font-size:13.5px; border-radius:10px; }
.sf .icon-btn{ display:inline-grid; place-items:center; width:40px; height:40px; border-radius:11px;
  border:1px solid var(--border2); background:var(--surface); color:var(--text); cursor:pointer;
  transition:transform .3s cubic-bezier(.2,.7,.3,1.4), background .25s, color .25s; }
.sf .icon-btn:hover{ background:var(--hover); transform:rotate(-12deg) scale(1.08); }

/* cards / surfaces */
.sf .card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r);
  transition:transform .25s ease, box-shadow .3s ease, border-color .25s, background .3s; }
.sf .card-h:hover{ transform:translateY(-4px); border-color:var(--border2); box-shadow:var(--shadow); }
.sf .glass{ background:color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter:blur(12px); }

/* nav */
.sf .nav{ position:sticky; top:0; z-index:40; border-bottom:1px solid var(--border);
  background:color-mix(in srgb,var(--bg) 78%, transparent); backdrop-filter:blur(14px); }
.sf .logo{ display:flex; align-items:center; gap:10px; font-weight:800; font-size:18px; letter-spacing:-.3px; cursor:pointer; }
.sf .logo .mark{ width:34px;height:34px;border-radius:10px;display:grid;place-items:center;
  background:var(--grad); color:#fff; box-shadow:0 8px 22px -8px var(--glow); }

/* hero orb */
.sf .orb{ position:absolute; border-radius:50%; filter:blur(60px); opacity:.55; pointer-events:none;
  animation:float 9s ease-in-out infinite; }

/* reveal on scroll */
.sf .reveal{ opacity:0; transform:translateY(26px); transition:opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
.sf .reveal.in{ opacity:1; transform:none; }

/* inputs */
.sf .input{ width:100%; background:var(--surface2); border:1px solid var(--border2); color:var(--text);
  border-radius:12px; padding:14px 16px; font-size:15px; outline:none; transition:border-color .2s, box-shadow .2s; }
.sf .input:focus{ border-color:var(--primary); box-shadow:0 0 0 4px var(--glow); }

/* tabs */
.sf .tabs{ display:inline-flex; background:var(--surface2); border:1px solid var(--border); border-radius:12px; padding:5px; gap:4px; }
.sf .tab{ display:inline-flex; align-items:center; gap:8px; padding:9px 15px; border-radius:9px; font-size:14px; font-weight:600;
  color:var(--muted); cursor:pointer; border:none; background:transparent; transition:color .2s, background .25s, transform .2s; }
.sf .tab:hover{ color:var(--text); }
.sf .tab.active{ color:#fff; background:var(--grad); box-shadow:0 8px 20px -10px var(--glow); }
.sf.light .tab.active{ color:#fff; }

/* dropzone */
.sf .drop{ border:2px dashed var(--border2); border-radius:18px; padding:44px 24px; text-align:center;
  transition:border-color .25s, background .25s, transform .25s; background:var(--surface2); }
.sf .drop.drag{ border-color:var(--primary); background:color-mix(in srgb,var(--primary) 10%, var(--surface2)); transform:scale(1.01); }

/* skeleton shimmer */
.sf .sk{ position:relative; overflow:hidden; background:var(--surface2); border-radius:10px; }
.sf .sk::after{ content:""; position:absolute; inset:0; transform:translateX(-100%);
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--text) 8%,transparent),transparent);
  animation:shimmer 1.5s infinite; }

/* flip card */
.sf .flip{ perspective:1400px; }
.sf .flip-inner{ position:relative; width:100%; height:100%; transition:transform .7s cubic-bezier(.2,.8,.2,1); transform-style:preserve-3d; }
.sf .flip.flipped .flip-inner{ transform:rotateY(180deg); }
.sf .flip-face{ position:absolute; inset:0; backface-visibility:hidden; display:grid; place-items:center;
  padding:32px; border-radius:20px; border:1px solid var(--border2); text-align:center; }
.sf .flip-front{ background:var(--surface); }
.sf .flip-back{ background:var(--grad); color:#fff; transform:rotateY(180deg); }

/* progress */
.sf .bar{ height:8px; border-radius:999px; background:var(--surface2); overflow:hidden; }
.sf .bar > i{ display:block; height:100%; background:var(--grad); border-radius:999px; transition:width .5s cubic-bezier(.2,.8,.2,1); }

/* spotlight tour */
.sf .tour-mask{ position:fixed; inset:0; z-index:70; background:rgba(4,6,12,.72); backdrop-filter:blur(2px); animation:fade .3s ease; }
.sf .tour-card{ position:fixed; z-index:71; width:320px; max-width:calc(100vw - 32px);
  background:var(--surface); border:1px solid var(--border2); border-radius:16px; padding:20px;
  box-shadow:var(--shadow); animation:pop .35s cubic-bezier(.2,.8,.2,1.2); }
.sf .spot{ position:fixed; z-index:70; border-radius:16px; box-shadow:0 0 0 3px var(--primary), 0 0 0 9999px rgba(4,6,12,.72);
  transition:all .4s cubic-bezier(.2,.8,.2,1); pointer-events:none; }

/* toast */
.sf .toast{ position:fixed; z-index:90; bottom:22px; left:50%; transform:translateX(-50%);
  background:var(--surface); border:1px solid var(--border2); border-radius:12px; padding:12px 18px;
  box-shadow:var(--shadow); display:flex; align-items:center; gap:10px; animation:pop .3s ease; }

/* keyframes */
@keyframes float{ 0%,100%{ transform:translateY(0) translateX(0);} 50%{ transform:translateY(-26px) translateX(14px);} }
@keyframes shimmer{ 100%{ transform:translateX(100%);} }
@keyframes fade{ from{opacity:0;} to{opacity:1;} }
@keyframes pop{ from{opacity:0; transform:translateY(8px) scale(.97);} to{opacity:1; transform:none;} }
@keyframes spin{ to{ transform:rotate(360deg);} }
@keyframes bob{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-7px);} }
.sf .spin{ animation:spin 1s linear infinite; }
.sf .bob{ animation:bob 3s ease-in-out infinite; }
.sf .fade-in{ animation:fade .5s ease both; }
.sf .pop-in{ animation:pop .45s cubic-bezier(.2,.8,.2,1.1) both; }

/* ---- full-page slide sections ---- */
.sf .fp{ height:100vh; overflow:hidden; position:relative; }
.sf .fp-track{ will-change:transform; transition:transform .9s cubic-bezier(.62,.02,.2,1); }
.sf .fp-sec{ height:100vh; width:100%; display:grid; place-items:center; position:relative;
  padding:96px 22px 70px; overflow:hidden; transition:opacity .7s ease, filter .7s ease; }
/* dim + soften the page being left behind so each change reads as a hand-off */
.sf .fp-sec:not(.on){ opacity:.35; filter:blur(2px); }
.sf .fp-inner{ width:100%; max-width:1120px; margin:0 auto; }
/* content rises in only when its section is active */
/* items drop in from above and settle into place with a slight bounce */
.sf .fp-sec .rise{ opacity:0; transform:translateY(-46px) scale(.93); filter:blur(9px);
  transition:opacity .55s ease, transform .95s cubic-bezier(.2,1.35,.32,1), filter .5s ease; }
.sf .fp-sec.on .rise{ opacity:1; transform:none; filter:none; }
.sf .fp-sec.on .rise.d1{ transition-delay:.05s; }
.sf .fp-sec.on .rise.d2{ transition-delay:.16s; }
.sf .fp-sec.on .rise.d3{ transition-delay:.27s; }
.sf .fp-sec.on .rise.d4{ transition-delay:.38s; }
.sf .fp-sec.on .rise.d5{ transition-delay:.49s; }
.sf .fp-sec.on .rise.d6{ transition-delay:.60s; }

/* fixed landing nav overlay */
.sf .lnav{ position:fixed; top:0; left:0; right:0; z-index:55; }
.sf .lnav-in{ max-width:1120px; margin:0 auto; padding:20px 22px; display:flex; align-items:center; justify-content:space-between; }

/* side progress dots */
.sf .dots{ position:fixed; right:26px; top:50%; transform:translateY(-50%); z-index:52;
  display:flex; flex-direction:column; gap:16px; }
.sf .dot{ width:11px; height:11px; border-radius:99px; border:2px solid var(--border2);
  background:transparent; cursor:pointer; padding:0; position:relative; transition:all .3s cubic-bezier(.2,.8,.2,1.3); }
.sf .dot:hover{ border-color:var(--primary); }
.sf .dot.on{ background:var(--grad); border-color:transparent; transform:scale(1.35); box-shadow:0 0 0 5px var(--glow); }
.sf .dot .lbl{ position:absolute; right:24px; top:50%; transform:translateY(-50%); white-space:nowrap;
  font-size:12px; font-weight:600; color:var(--text); background:var(--surface); border:1px solid var(--border2);
  padding:4px 10px; border-radius:8px; opacity:0; pointer-events:none; transition:opacity .25s; box-shadow:var(--shadow); }
.sf .dot:hover .lbl{ opacity:1; }

/* scroll hint */
.sf .scrollhint{ position:absolute; bottom:30px; left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:6px; color:var(--faint);
  font-size:11px; letter-spacing:2px; cursor:pointer; animation:bob 2.4s ease-in-out infinite; z-index:5; }
.sf .scrollhint:hover{ color:var(--primary2); }

/* ===== Nkae-style stacked-panel scroll ===== */
/* Each panel sticky-pins at the top; the next one scrolls up over it with a
   rounded top + top shadow, so panels appear to slide over one another. */
.sf .stack{ position:relative; }
.sf .panel{ position:sticky; top:0; min-height:100vh; display:grid; place-items:center;
  padding:120px 24px 84px; overflow:hidden; }
.sf .panel-round{ border-radius:34px 34px 0 0; box-shadow:0 -34px 70px -24px rgba(0,0,0,.65); }
.sf .panel-dark{ background:var(--bg); color:var(--text); }
.sf .panel-alt{ background:var(--bg2); color:var(--text); }
.sf .panel-cream{ background:var(--cream); color:var(--cream-ink);
  background-image:radial-gradient(rgba(27,27,36,.10) 1px, transparent 1px); background-size:22px 22px; }
.sf .panel-cream .p-sub{ color:var(--cream-muted); }
.sf .pin{ width:100%; max-width:1080px; margin:0 auto; position:relative; z-index:2; }

/* giant faint wordmark watermark behind a panel */
.sf .wm{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  pointer-events:none; font-weight:900; font-size:24vw; letter-spacing:-.06em; opacity:.04;
  color:currentColor; white-space:nowrap; z-index:0; }
.sf .wm-brand{ opacity:.14; }
.sf .wm-brand .wm-n{ color:#0d9488; }
.sf .wm-brand .wm-m{ color:#d9a521; }

/* mono eyebrows + kickers */
.sf .eyebrow{ position:absolute; top:28px; left:28px; z-index:3; font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:12px; letter-spacing:3px; text-transform:uppercase; color:var(--faint); }
.sf .panel-cream .eyebrow{ color:rgba(27,27,36,.4); }
.sf .kicker{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px;
  letter-spacing:4px; text-transform:uppercase; color:var(--primary2); }
.sf .panel-cream .kicker{ color:var(--primary); }
.sf .amber{ color:var(--amber); }
.sf .display{ font-size:clamp(38px,6vw,72px); line-height:1.02; letter-spacing:-2.2px; font-weight:850; margin:0; }

/* landing top nav (Sign in pill) */
.sf .signin{ display:inline-flex; align-items:center; padding:9px 18px; border-radius:999px;
  background:var(--text); color:var(--bg); font-weight:650; font-size:14px; border:none; cursor:pointer;
  transition:transform .2s, opacity .2s; }
.sf .signin:hover{ transform:translateY(-1px); opacity:.9; }

/* tilted flashcard hero visual */
.sf .tilt{ transform:perspective(1500px) rotateY(-17deg) rotateX(7deg) rotate(2deg);
  transition:transform .6s cubic-bezier(.2,.8,.2,1); }
.sf .tilt:hover{ transform:perspective(1500px) rotateY(-9deg) rotateX(4deg) rotate(1deg); }
.sf .paper{ position:relative; width:330px; min-height:310px; border-radius:14px; padding:34px 32px 30px;
  color:#20202a; background:#fbfaf6;
  background-image:repeating-linear-gradient(#fbfaf6 0 28px, #dbe6f1 28px 29px);
  box-shadow:0 46px 90px -34px rgba(0,0,0,.75), 0 0 0 1px rgba(0,0,0,.05); overflow:hidden; }
.sf .paper::before{ content:""; position:absolute; top:0; bottom:0; left:36px; width:2px; background:#f0b4b4; }
.sf .paper .q-tag{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:2px; color:var(--primary);
  text-transform:uppercase; text-align:center; margin-bottom:18px; }
.sf .paper .q-text{ font-size:21px; line-height:1.5; text-align:center; font-weight:600;
  font-family:"Bradley Hand","Segoe Print","Comic Sans MS",cursive; }

/* 3-step connector flow */
.sf .flow{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; position:relative; }
.sf .flow::before{ content:""; position:absolute; left:10%; right:10%; top:34px; height:2px; z-index:0;
  background:repeating-linear-gradient(90deg,var(--border2) 0 7px, transparent 7px 15px); }
.sf .fnode{ position:relative; z-index:2; flex:1; display:flex; flex-direction:column; align-items:center;
  gap:16px; text-align:center; max-width:240px; }
.sf .ftile-lg{ position:relative; width:70px; height:70px; border-radius:20px; display:grid; place-items:center;
  background:var(--surface); border:1px solid var(--border2); color:var(--primary2); box-shadow:var(--shadow); }
.sf .fbadge{ position:absolute; top:-9px; right:-9px; width:26px; height:26px; border-radius:99px;
  background:var(--amber); color:#04121f; font-size:13px; font-weight:850; display:grid; place-items:center;
  box-shadow:0 6px 16px -3px rgba(56,189,248,.65); }

/* icon-row feature list (cream panel) */
.sf .frow{ display:flex; gap:18px; align-items:flex-start; padding:22px 4px;
  border-top:1px solid rgba(27,27,36,.12); transition:transform .2s; }
.sf .frow:first-child{ border-top:none; }
.sf .frow:hover{ transform:translateX(4px); }
.sf .ftile{ flex:none; width:52px; height:52px; border-radius:14px; background:#fff; display:grid; place-items:center;
  color:var(--primary); box-shadow:0 10px 22px -12px rgba(40,25,90,.35), 0 0 0 1px rgba(27,27,36,.05); }

/* scroll cue */
.sf .cue{ position:absolute; bottom:26px; left:50%; transform:translateX(-50%); z-index:3;
  display:flex; flex-direction:column; align-items:center; gap:5px; color:var(--faint);
  font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:2px; animation:bob 2.4s ease-in-out infinite; }

/* ================= FUTURISTIC / FUI LAYER ================= */
.sf .fp-track{ position:relative; z-index:1; }

/* animated aurora field behind the (transparent) dark pages */
.sf .aurora{ position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
.sf .aurora i{ position:absolute; border-radius:50%; filter:blur(100px); display:block; }
.sf .aurora .a1{ width:60vw; height:60vw; background:none; opacity:0; top:-20%; left:-14%; animation:drift 20s ease-in-out infinite; }
.sf .aurora .a2{ width:54vw; height:54vw; background:radial-gradient(circle,#f4c25a,transparent 64%); opacity:.14; bottom:-24%; right:-16%; animation:drift 27s ease-in-out infinite reverse; }
.sf .aurora .a3{ width:44vw; height:44vw; background:none; opacity:0; top:28%; right:18%; animation:drift 33s ease-in-out infinite; }
@keyframes drift{ 0%,100%{ transform:translate(0,0) scale(1);} 33%{ transform:translate(6vw,-4vh) scale(1.12);} 66%{ transform:translate(-5vw,5vh) scale(.94);} }

/* faint tech grid, vignette-masked */
.sf .grid-bg{ position:absolute; inset:0; z-index:0; pointer-events:none;
  background-image:linear-gradient(rgba(120,165,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(120,165,255,.07) 1px,transparent 1px);
  background-size:48px 48px;
  -webkit-mask-image:radial-gradient(ellipse 82% 72% at 50% 45%, #000 28%, transparent 82%);
  mask-image:radial-gradient(ellipse 82% 72% at 50% 45%, #000 28%, transparent 82%); }

/* CRT-ish scanlines over everything (very subtle) */
.sf .scan{ position:fixed; inset:0; z-index:58; pointer-events:none; opacity:.55;
  background:repeating-linear-gradient(180deg, rgba(150,185,255,.035) 0 1px, transparent 1px 3px); }

/* neon glow on type */
.sf .fp-sec .display{ text-shadow:0 0 34px rgba(79,124,255,.4); }
.sf .logo{ text-shadow:0 0 22px rgba(79,124,255,.45); }

/* glassmorphism + luminous holographic border + HUD corner brackets */
.sf .glassx{ background:linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.015)); backdrop-filter:blur(16px);
  border:1px solid rgba(120,165,255,.24);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12), 0 22px 55px -22px rgba(0,0,0,.75), 0 0 46px -12px rgba(79,124,255,.4); }
.sf .glow-border{ position:relative; }
.sf .glow-border::before{ content:""; position:absolute; inset:-1px; border-radius:inherit; padding:1px; pointer-events:none;
  background:linear-gradient(120deg,#38bdf8,#4f7cff,#22d3ee,#38bdf8); background-size:300% 100%;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude;
  animation:sheen 6s linear infinite; opacity:.8; }
@keyframes sheen{ to{ background-position:300% 0; } }
.sf .hud::before, .sf .hud::after{ content:""; position:absolute; width:16px; height:16px; border:2px solid var(--primary2); opacity:.85; z-index:3; }
.sf .hud::before{ top:-1px; left:-1px; border-right:0; border-bottom:0; border-top-left-radius:6px; }
.sf .hud::after{ bottom:-1px; right:-1px; border-left:0; border-top:0; border-bottom-right-radius:6px; }

/* neon buttons with a light-sweep */
.sf .btn-primary{ position:relative; overflow:hidden; box-shadow:0 0 26px -2px var(--glow), 0 12px 32px -8px var(--glow); }
.sf .btn-primary::after{ content:""; position:absolute; inset:0; background:linear-gradient(110deg,transparent 22%,rgba(255,255,255,.30) 50%,transparent 78%); transform:translateX(-130%); }
.sf .btn-primary:hover::after{ animation:swipe .8s ease; }
@keyframes swipe{ to{ transform:translateX(130%);} }

/* holographic ring around the hero flashcard */
.sf .paper{ box-shadow:0 46px 90px -34px rgba(0,0,0,.8), 0 0 60px -6px rgba(79,124,255,.45), 0 0 0 1px rgba(0,0,0,.05); }

/* dark-glass feature tiles + rows (toolkit is now dark neon, not cream) */
.sf .p-sub{ color:var(--muted); }
.sf .frow{ border-top:1px solid var(--border); }
.sf .ftile{ background:var(--surface); color:var(--primary2);
  box-shadow:0 0 22px -8px var(--glow), inset 0 1px 0 rgba(255,255,255,.06); border:1px solid var(--border2); }
.sf .ftile-lg{ box-shadow:0 0 34px -10px var(--glow), var(--shadow); }

/* ===== note → question "transmutation" card ===== */
.sf .xmut{ position:relative; width:340px; min-height:326px; border-radius:16px; overflow:hidden; text-align:left; color:var(--text);
  background:linear-gradient(160deg, rgba(16,30,70,.6), rgba(8,14,34,.66)); backdrop-filter:blur(14px);
  border:1px solid rgba(120,165,255,.30);
  box-shadow:0 46px 90px -34px rgba(0,0,0,.82), 0 0 64px -6px rgba(79,124,255,.5), inset 0 1px 0 rgba(255,255,255,.09); }
.sf .xmut::after{ content:""; position:absolute; inset:0; pointer-events:none; z-index:1;
  background-image:linear-gradient(rgba(120,165,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(120,165,255,.05) 1px,transparent 1px);
  background-size:26px 26px; opacity:.6; }
.sf .xmut-bar{ position:relative; z-index:2; display:flex; align-items:center; gap:8px; padding:11px 16px;
  font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:1.5px; color:var(--muted);
  border-bottom:1px solid rgba(120,165,255,.16); }
.sf .xdot{ width:8px; height:8px; border-radius:99px; background:#22d3ee; box-shadow:0 0 10px #22d3ee; }
.sf .xstatus{ margin-left:auto; position:relative; width:104px; height:14px; }
.sf .xstatus > span{ position:absolute; right:0; top:0; white-space:nowrap; }
.sf .s-raw{ color:#7dd3fc; animation:rawcycle 6s ease-in-out infinite; }
.sf .s-clean{ color:#5eead4; opacity:0; animation:cleancycle 6s ease-in-out infinite; }
.sf .xmut-body{ position:relative; z-index:2; height:252px; }
.sf .xmut-layer{ position:absolute; inset:0; padding:26px 26px; }
.sf .xmut-raw{ animation:rawcycle 6s ease-in-out infinite; }
.sf .xmut-clean{ opacity:0; animation:cleancycle 6s ease-in-out infinite; }
.sf .scrawl{ font-family:"Bradley Hand","Segoe Print","Comic Sans MS",cursive; font-size:16px; line-height:1.95; color:rgba(205,222,255,.5); }
.sf .scrawl:nth-child(1){ transform:rotate(-1.2deg); }
.sf .scrawl:nth-child(2){ transform:rotate(.8deg) translateX(6px); }
.sf .scrawl:nth-child(3){ transform:rotate(-.6deg); }
.sf .scrawl:nth-child(4){ transform:rotate(1deg) translateX(3px); color:rgba(205,222,255,.34); }
.sf .q-text2{ font-size:22px; font-weight:730; line-height:1.4; margin:14px 0 20px; text-shadow:0 0 22px rgba(79,124,255,.45); }
.sf .q-ans{ display:inline-flex; align-items:center; padding:7px 13px; border-radius:9px; font-size:13px; font-weight:650;
  color:#67e8f9; background:rgba(34,211,238,.10); border:1px solid rgba(34,211,238,.35); box-shadow:0 0 20px -6px rgba(34,211,238,.55); }
.sf .xbeam{ position:absolute; left:0; right:0; top:0; height:3px; z-index:3; opacity:0;
  background:linear-gradient(90deg,transparent,#22d3ee 30%,#4f7cff 70%,transparent);
  box-shadow:0 0 24px 6px rgba(79,124,255,.65); animation:beam 6s ease-in-out infinite; }
@keyframes beam{ 0%{ top:-4px; opacity:0; } 6%{ opacity:1; } 40%{ top:100%; opacity:1; } 47%{ opacity:0; } 100%{ opacity:0; } }
@keyframes rawcycle{ 0%,30%{ opacity:1; } 44%{ opacity:0; } 90%{ opacity:0; } 100%{ opacity:1; } }
@keyframes cleancycle{ 0%,34%{ opacity:0; } 48%{ opacity:1; } 88%{ opacity:1; } 100%{ opacity:0; } }

/* ===== intro: draw the logo, then pull it to the nav ===== */
.sf .intro{ position:fixed; inset:0; z-index:200; display:grid; place-items:center; pointer-events:none; }
.sf .intro-bg{ position:absolute; inset:0; background:var(--cream);
  background-image:radial-gradient(rgba(27,27,36,.10) 1px, transparent 1px); background-size:22px 22px; }
.sf .intro-logo{ position:relative; z-index:2; display:flex; align-items:center; justify-content:center; will-change:transform; }
.sf .intro-mark{ position:relative; display:grid; place-items:center; }
.sf .intro-mark::before{ display:none; }
.sf .intro-tile{ display:none; }
.sf .intro-cap{ position:relative; z-index:2; overflow:visible; }
.sf .intro-cap .cap{ fill:none; stroke-linecap:round; stroke-linejoin:round;
  filter:drop-shadow(0 2px 5px rgba(0,0,0,.4)); }
/* the NousMax word — pencil-drawn (stroke) then inked (fill); the SAME SVG is
   reused as the resting page watermark so the hand-off is seamless. */
.sf .intro-morph{ position:absolute; inset:0; z-index:1; display:flex; align-items:center; justify-content:center;
  pointer-events:none; opacity:0; transform:scale(.6); will-change:transform,opacity; }
.sf .morph-svg{ width:94vw; height:auto; overflow:visible; }
.sf .morph-text{ font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  font-size:250px; font-weight:900; letter-spacing:-14px; }
.sf .mt-n{ fill:none; stroke:#0d9488; stroke-width:2.4; stroke-linejoin:round; transition:fill .55s ease; }
.sf .mt-m{ fill:none; stroke:#d9a521; stroke-width:2.4; stroke-linejoin:round; transition:fill .55s ease; }
.sf .intro-morph .morph-text{ stroke-dasharray:13000; stroke-dashoffset:13000; }
.sf .intro-morph.play .morph-text{ animation:drawWord 1.7s ease forwards; }
@keyframes drawWord{ to{ stroke-dashoffset:0; } }
.sf .intro-morph.fill .mt-n{ fill:#0d9488; }
.sf .intro-morph.fill .mt-m{ fill:#d9a521; }
/* resting page watermark: same word, always solid */
.sf .wm-brand .mt-n{ fill:#0d9488; stroke:none; }
.sf .wm-brand .mt-m{ fill:#d9a521; stroke:none; }
.sf .intro-word{ font-weight:850; font-size:40px; letter-spacing:-1px; white-space:nowrap; color:var(--text);
  clip-path:inset(0 100% 0 0); text-shadow:0 0 26px rgba(79,124,255,.5); }
@keyframes iring{ 0%{ opacity:.7; transform:translate(-50%,-50%) scale(.6);} 100%{ opacity:0; transform:translate(-50%,-50%) scale(2.3);} }
/* a real pencil — JS positions its tip on the drawing point every frame */
.sf .intro-pencil{ position:absolute; left:0; top:0; z-index:6; width:46px; height:46px; pointer-events:none;
  transform-origin:18px 42px; opacity:0; will-change:transform,opacity; }
.sf .intro-pencil svg{ display:block; filter:drop-shadow(0 5px 7px rgba(0,0,0,.5)); }
/* hold hero elements hidden until the logo starts pulling up, then they cascade */
.sf.booting .fp-sec.on .rise{ opacity:0; transform:translateY(-46px) scale(.93); filter:blur(9px); }
/* hide the real nav logo during the intro so the flying logo becomes it (no duplicate) */
/* nav chrome + watermark reveal only AFTER the whole intro finishes */
.sf .lnav .logo, .sf .lnav .signin, .sf .lnav .icon-btn, .sf .dots, .sf .cue, .sf .wm-brand{ transition:opacity .6s ease; }
.sf:not(.nav-up) .lnav .logo, .sf:not(.nav-up) .lnav .signin, .sf:not(.nav-up) .lnav .icon-btn,
.sf:not(.nav-up) .dots, .sf:not(.nav-up) .cue{ opacity:0; pointer-events:none; }
.sf:not(.wm-on) .wm-brand{ opacity:0; }
/* the hero page arrives blurred and pulls into focus as the mark drops behind it */
.sf:not(.booting) .fp-track{ animation:heroFocus 1.4s cubic-bezier(.3,.7,.2,1) both; }
@keyframes heroFocus{ from{ filter:blur(16px); } to{ filter:blur(0); } }

/* ===== MUTED / LOW-GLOW: dark aesthetic, bright colour used sparingly ===== */
.sf .fp-sec .display{ text-shadow:none; }
.sf .logo, .sf .q-text2, .sf .intro-word{ text-shadow:none; }
.sf .btn-primary{ box-shadow:0 10px 26px -14px rgba(0,0,0,.72); }
.sf .btn-primary::after{ display:none; }                 /* no light sweep */
.sf .glow-border::before{ animation:none; opacity:.28;
  background:linear-gradient(120deg, rgba(150,172,215,.5), rgba(150,172,215,.10)); }
.sf .glassx{ box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 22px 55px -24px rgba(0,0,0,.72); }
.sf .paper, .sf .xmut{ box-shadow:0 42px 80px -34px rgba(0,0,0,.82), 0 0 0 1px rgba(120,150,215,.09); }
.sf .aurora .a1, .sf .aurora .a2, .sf .aurora .a3{ opacity:.16; }
.sf .xbeam{ background:linear-gradient(90deg,transparent,#5f7aa4 40%,#3f5f96 70%,transparent);
  box-shadow:0 0 10px 1px rgba(120,150,215,.28); }
.sf .fbadge{ background:var(--amber); color:#3a2a05; border:none; box-shadow:0 4px 12px -3px rgba(244,194,90,.5); }
/* cream toolkit panel: white tiles with indigo icons + dark ink, like nkae */
.sf .panel-cream .ftile{ background:#fff; color:var(--primary); box-shadow:0 10px 22px -12px rgba(40,25,90,.28); border:1px solid rgba(28,27,35,.06); }
.sf .panel-cream .frow{ border-top:1px solid rgba(28,27,35,.12); }

/* ===== all-cream landing: recolor the purple accent → teal (complements cream) =====
   scoped to the landing + intro only, so the dark app keeps its purple identity. */
.sf .fp, .sf .intro{
  --primary:#0d9488; --primary2:#0f766e; --accent:#14b8a6; --accent2:#2dd4bf;
  --grad:linear-gradient(150deg,#14b8a6,#0d7d6e); --glow:rgba(20,184,166,.3);
}
/* ===== all-cream landing: adapt shared text, nav, tiles & dots to cream ===== */
.sf .panel-cream .muted{ color:var(--cream-muted); }
.sf .panel-cream .faint{ color:rgba(28,27,35,.5); }
.sf .panel-cream .amber{ color:#bd8619; }
.sf .panel-cream .display{ color:var(--cream-ink); }
.sf .panel-cream .ftile-lg{ background:#fff; color:var(--primary); border:1px solid rgba(28,27,35,.06);
  box-shadow:0 14px 30px -16px rgba(40,25,90,.3); }
.sf .panel-cream .flow::before{ background:linear-gradient(90deg, transparent, rgba(28,27,35,.18), transparent); }
/* the last page's CTA sits transparent, directly on the cream */
.sf .cta-card{ background:transparent; border:none; box-shadow:none; }
/* landing buttons: flat, no glow/halo/border — just a subtle hover lift */
.sf .fp .btn-primary{ box-shadow:none; border:none; outline:none; }
.sf .fp .btn-primary:hover{ box-shadow:none; transform:translateY(-2px); filter:brightness(1.06); }
.sf .fp .btn-primary:focus-visible{ outline:none; box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 30%, transparent); }
/* hero page 1: content on the left, right half reserved for later */
.sf .pin.hero-left{ display:flex; justify-content:flex-start; align-items:center; }
.sf .hero-col{ max-width:560px; text-align:left; }
@media (max-width:860px){ .sf .pin.hero-left{ justify-content:center; } .sf .hero-col{ text-align:center; max-width:600px; margin:0 auto; } }
/* fixed nav on cream */
.sf .fp .lnav .logo{ color:var(--cream-ink); text-shadow:none; }
.sf .fp .lnav .signin{ background:var(--cream-ink); color:var(--cream); }
.sf .fp .lnav .icon-btn{ color:var(--cream-ink); background:rgba(28,27,35,.05); border-color:rgba(28,27,35,.14); }
/* scroll cue + page dots on cream */
.sf .fp .cue{ color:var(--cream-muted); }
.sf .fp .dot{ border-color:rgba(28,27,35,.28); }
.sf .fp .dot .lbl{ color:var(--cream-ink); background:#fff; border:1px solid rgba(28,27,35,.1); }
.sf .q-ans{ color:#a9b6d2; background:rgba(120,150,215,.08); border-color:rgba(120,150,215,.22); box-shadow:none; }
.sf .xdot{ background:#5f7aa4; box-shadow:none; }
.sf .ftile, .sf .ftile-lg{ box-shadow:0 12px 26px -16px rgba(0,0,0,.72); }
.sf .dot.on{ box-shadow:0 0 0 4px rgba(120,150,215,.15); }
.sf .intro-mark svg{ filter:none; }
.sf .intro-mark::before{ border-color:rgba(150,172,215,.4); }

/* ===== auto-playing hero quiz pipeline — spotlight focus, transparent bg ===== */
.sf .qpipe{ display:flex; align-items:center; justify-content:center; gap:6px; max-width:900px; margin:0 auto; text-align:left; }
.sf .qp-node{ position:relative; flex:1 1 0; min-width:0; background:transparent; border:1px solid transparent; border-radius:16px;
  padding:16px 16px 17px; display:flex; flex-direction:column; will-change:opacity,transform,filter;
  transition:opacity .6s cubic-bezier(.22,.9,.24,1), transform .6s cubic-bezier(.22,.9,.24,1), filter .6s ease, border-color .5s ease; }
/* spotlight focus states */
.sf .qp-node.hidden{ opacity:0; transform:translateX(-16px) scale(.93); filter:blur(3px); pointer-events:none; }
.sf .qp-node.past{ opacity:.24; transform:scale(.9); filter:blur(1.4px); }
.sf .qp-node.focus{ opacity:1; transform:scale(1); filter:none; border-color:var(--border2); }
.sf .qp-node.focus::before{ content:""; position:absolute; inset:-2px; z-index:-1; border-radius:18px;
  background:radial-gradient(130% 130% at 50% 8%, var(--glow), transparent 66%); opacity:.9; animation:qpGlow .6s ease both; }
@keyframes qpGlow{ from{ opacity:0; } to{ opacity:.9; } }
.sf .qp-cap{ font-family:ui-monospace,monospace; font-size:10px; letter-spacing:1.6px; text-transform:uppercase; color:var(--primary2); margin-bottom:9px; }
.sf .qp-cap.ok{ color:var(--ok); }
.sf .qp-q{ font-size:14.5px; font-weight:800; line-height:1.28; margin-bottom:13px; }
.sf .qp-opts{ display:flex; flex-direction:column; gap:6px; margin-top:auto; }
.sf .qp-opt{ display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:9px;
  background:color-mix(in srgb, var(--surface2) 55%, transparent); border:1px solid var(--border); font-size:12.5px; font-weight:600; }
.sf .qp-k{ display:grid; place-items:center; width:21px; height:21px; border-radius:6px; background:color-mix(in srgb,var(--hover) 70%, transparent);
  font-family:ui-monospace,monospace; font-size:10.5px; color:var(--muted); flex:none; }
.sf .qp-t{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sf .qp-k.ok{ background:var(--ok); color:#052b1c; }
/* flowing arrows */
.sf .qp-arr{ flex:none; align-self:center; color:var(--faint); opacity:.16;
  transition:opacity .6s ease, color .6s ease; }
.sf .qp-arr.on{ opacity:.75; color:var(--primary2); }
.sf .qp-arr.flow{ opacity:1; animation:qpFlow 1.15s ease-in-out infinite; }
@keyframes qpFlow{ 0%,100%{ transform:translateX(-3px); opacity:.5; } 50%{ transform:translateX(3px); opacity:1; } }
/* generating */
.sf .qp-mid{ justify-content:center; }
.sf .qp-spin{ animation:sp 1s linear infinite; color:var(--primary2); margin:2px 0 11px; }
.sf .qp-genlist{ display:flex; flex-direction:column; gap:7px; font-family:ui-monospace,monospace; font-size:11px; color:var(--muted); }
.sf .qp-genlist > div{ display:inline-flex; align-items:center; gap:7px; }
.sf .qp-genlist .on{ color:var(--ok); }
.sf .qp-dot{ width:10px; height:10px; border:1.7px solid var(--primary2); border-top-color:transparent; border-radius:50%; display:inline-block; animation:sp 1s linear infinite; flex:none; }
/* answer */
.sf .qp-ans{ justify-content:center; }
.sf .qp-ansrow{ display:flex; align-items:center; gap:9px; font-size:15.5px; font-weight:800; margin-bottom:9px; }
.sf .qp-ansmark{ position:relative; display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:800; color:var(--ok); padding-bottom:6px; }
.sf .qp-scribble{ position:absolute; left:0; right:0; bottom:-2px; height:9px; color:var(--amber); pointer-events:none; }
.sf .qp-scribble path{ stroke-dasharray:220; stroke-dashoffset:220; animation:qpDraw .7s ease .3s forwards; }
@keyframes qpDraw{ to{ stroke-dashoffset:0; } }

@media (max-width:680px){
  .sf .qpipe{ flex-direction:column; align-items:stretch; }
  .sf .qp-node.hidden{ transform:translateY(-16px) scale(.93); }
  .sf .qp-arr{ transform:rotate(90deg); align-self:center; }
  .sf .qp-arr.flow{ animation:qpFlowV 1.15s ease-in-out infinite; }
}
@keyframes qpFlowV{ 0%,100%{ transform:rotate(90deg) translateX(-3px); opacity:.5; } 50%{ transform:rotate(90deg) translateX(3px); opacity:1; } }

/* ===== interactive flip card (hero note) ===== */
.sf .qcard{ position:relative; display:inline-block; cursor:pointer; transform:rotate(1.5deg); transition:transform .35s cubic-bezier(.2,.8,.2,1); }
.sf .qcard:hover{ transform:rotate(0deg) translateY(-4px); }
.sf .flipcard{ perspective:1600px; width:340px; height:330px; }
.sf .flipcard-inner{ position:relative; width:100%; height:100%; transition:transform .75s cubic-bezier(.2,.85,.25,1); transform-style:preserve-3d; }
.sf .flipcard.flipped .flipcard-inner{ transform:rotateY(180deg); }
.sf .fc-face{ position:absolute; inset:0; width:100%; height:100%; min-height:0; overflow:hidden;
  backface-visibility:hidden; -webkit-backface-visibility:hidden; }
.sf .fc-back{ transform:rotateY(180deg); }
.sf .fc-hint{ display:flex; align-items:center; gap:7px; margin-top:16px; font-family:ui-monospace,monospace; font-size:11px; letter-spacing:1px; color:var(--faint); }
.sf .xbeam-once{ position:absolute; left:0; right:0; top:0; height:3px; z-index:3;
  background:linear-gradient(90deg,transparent,#5f7aa4 40%,#3f5f96 70%,transparent);
  box-shadow:0 0 10px 1px rgba(120,150,215,.3); animation:beamOnce 1.3s ease .12s both; }
@keyframes beamOnce{ 0%{ top:-4px; opacity:0; } 8%{ opacity:1; } 90%{ opacity:1; } 100%{ top:100%; opacity:0; } }

/* ===== auth (sign-up / sign-in) modal ===== */
/* auth overlay centers the card; only the overlay scrolls if a small screen needs it
   (so the card itself never shows scrollbars). */
.sf .auth-mask{ display:grid; place-items:center; padding:16px; overflow-y:auto; }
.sf .authcard{ position:relative; z-index:121; width:404px; max-width:calc(100vw - 32px);
  border-radius:20px; padding:34px 30px; }
/* no hover movement anywhere on the popup */
.sf .authcard .btn-primary:hover, .sf .authcard .btn-ghost:hover, .sf .authcard .icon-btn:hover{ transform:none; }
.sf .auth-div{ display:flex; align-items:center; gap:12px; margin:16px 0; color:var(--faint);
  font-size:12px; text-transform:uppercase; letter-spacing:1px; }
.sf .auth-div::before, .sf .auth-div::after{ content:""; flex:1; height:1px; background:var(--border2); }
.sf .linklike{ background:none; border:none; color:var(--primary2); cursor:pointer; font-size:13.5px; padding:0; text-decoration:underline; }
.sf .linklike:hover{ opacity:.85; }

/* ===== study tools (Phase-2 features) ===== */
.sf .secnav{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
.sf .secnav button{ display:inline-flex; align-items:center; gap:8px; padding:9px 15px; border-radius:11px;
  border:1px solid var(--border); background:var(--surface); color:var(--muted); font-weight:650; font-size:14px; cursor:pointer;
  transition:background .2s, color .2s, transform .15s; }
.sf .secnav button:hover{ color:var(--text); background:var(--hover); transform:translateY(-1px); }
.sf .secnav button.on{ color:#fff; background:var(--grad); border-color:transparent; }
.sf .secnav .badge{ font-size:11px; font-weight:800; padding:1px 7px; border-radius:99px; background:var(--amber); color:#3a2a05; }

.sf .heat{ display:grid; grid-auto-flow:column; grid-template-rows:repeat(7,1fr); gap:4px; overflow:hidden; }
.sf .heat i{ width:13px; height:13px; border-radius:3px; background:var(--surface2); display:block; }
.sf .heat i.l1{ background:color-mix(in srgb,var(--primary) 32%, var(--surface2)); }
.sf .heat i.l2{ background:color-mix(in srgb,var(--primary) 55%, var(--surface2)); }
.sf .heat i.l3{ background:color-mix(in srgb,var(--primary) 78%, var(--surface2)); }
.sf .heat i.l4{ background:var(--primary); }

.sf .pomo{ position:relative; width:236px; height:236px; margin:0 auto; }
.sf .pomo .time{ position:absolute; inset:0; display:grid; place-items:center; font-size:46px; font-weight:840; letter-spacing:-1.5px; }

.sf .chat{ display:flex; flex-direction:column; height:460px; }
.sf .chat-log{ flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:12px; padding:8px 2px; }
.sf .bub{ max-width:80%; padding:11px 15px; border-radius:14px; font-size:14.5px; line-height:1.5; }
.sf .bub.me{ align-self:flex-end; background:var(--grad); color:#fff; border-bottom-right-radius:4px; }
.sf .bub.ai{ align-self:flex-start; background:var(--surface2); border:1px solid var(--border); border-bottom-left-radius:4px; }

.sf .grade{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:18px; }
.sf .grade button{ padding:13px 8px; border-radius:12px; border:1px solid var(--border2); background:var(--surface); color:var(--text);
  cursor:pointer; font-weight:700; font-size:13.5px; transition:transform .15s, background .2s; }
.sf .grade button:hover{ transform:translateY(-2px); background:var(--hover); }
.sf .grade button b{ display:block; font-size:11px; font-weight:600; color:var(--faint); margin-top:2px; }

.sf .stat{ background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px; }
.sf .stat .big{ font-size:32px; font-weight:850; letter-spacing:-1px; line-height:1; }

@media (max-width:760px){
  .sf .hide-sm{ display:none !important; }
  .sf .wrap{ padding:0 16px; }
  .sf .dots{ right:12px; gap:12px; }
  .sf .fp-sec{ padding:86px 16px 60px; }
  .sf .panel{ padding:104px 18px 70px; }
  .sf .flow{ flex-direction:column; align-items:center; gap:26px; }
  .sf .flow::before{ display:none; }
  .sf .wm{ font-size:40vw; }
}
`;


/* small helper: reveal-on-scroll wrapper ---------------------------------- */
function Reveal({ children, delay = 0, style, className = "" }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}


/* =========================================================================
   3) GLOBAL NAV
   ========================================================================= */
// The "NousMax" wordmark as one SVG — used both as the drawn intro word (stroke,
// then filled) and as the resting page watermark (filled). Being the same element
// in both places makes the hand-off seamless.
function NousMaxWord() {
  return (
    <svg className="morph-svg" viewBox="0 0 1240 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <text x="620" y="214" textAnchor="middle" className="morph-text">
        <tspan className="mt-n">Nous</tspan><tspan className="mt-m">Max</tspan>
      </text>
    </svg>
  );
}

// NousMax mark — an overlapping N (teal) + M (gold) monogram, one glyph.
function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="nm-mark" aria-hidden="true">
      <path className="nm-n" d="M22 74 L22 26 L54 74 L54 26" stroke="#0d9488" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path className="nm-m" d="M42 74 L42 26 L58 52 L74 26 L74 74" stroke="#d9a521" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function Nav({ theme, toggleTheme, onLogo, onOpenLibrary, showApp }) {
  return (
    <div className="nav">
      <div className="wrap row" style={{ height: 66, justifyContent: "space-between" }}>
        <div className="logo" onClick={onLogo}>
          <LogoMark size={30} />
          <span>Nous<span className="grad-text">Max</span></span>
        </div>
        <div className="row gap12">
          {showApp && (
            <button className="btn btn-ghost btn-sm" onClick={onOpenLibrary}>
              <Library size={16} /> <span className="hide-sm">Library</span>
            </button>
          )}
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}


/* =========================================================================
   4) LANDING / HERO
   ========================================================================= */
const STEPS = [
  { icon: Upload, title: "Add a source", body: "Drop in a PDF, DOCX or screenshot — or paste a YouTube link. Search a topic and we suggest videos." },
  { icon: BrainCircuit, title: "We prep it", body: "Your material is turned into a clean, studyable source, ready for the tools." },
  { icon: Sparkles, title: "Generate tools", body: "Spin up quizzes, summary notes and flashcards from any source in a click." },
  { icon: Trophy, title: "Study & track", body: "Take quizzes, flip cards and review notes — built to actually help you learn." },
];
const FEATURES = [
  { icon: FileUp, title: "File upload", body: "PDF, DOCX and image/screenshot sources with drag-and-drop.", c: "var(--primary)" },
  { icon: Youtube, title: "YouTube learning", body: "Paste a link or search a topic to learn from the best videos.", c: "var(--accent)" },
  { icon: ListChecks, title: "AI quizzes", body: "Auto-generated multiple choice, true/false and short answer.", c: "var(--primary2)" },
  { icon: StickyNote, title: "Summary notes", body: "Structured, readable notes you'd actually study from.", c: "var(--accent2)" },
  { icon: Layers, title: "Flashcards", body: "Flip-card decks with progress tracking for fast recall.", c: "var(--primary)" },
  { icon: Zap, title: "One hub", body: "Every tool generated from a single source panel.", c: "var(--accent)" },
];

// The 3-step "flow" shown with a dashed connector + numbered amber badges.
const FLOW = [
  { icon: Upload, t: "Add a source", d: "Upload a PDF, DOCX or screenshot — or paste a YouTube link." },
  { icon: Sparkles, t: "Generate", d: "NousMax turns it into summaries, quizzes and flashcards." },
  { icon: Trophy, t: "Review & remember", d: "Take quizzes and flip cards, resurfaced at the right moment." },
];
// The cream "toolkit" panel's icon-row feature list.
const TOOLS = [
  { icon: StickyNote, t: "AI summaries", d: "Notes in, clarity out. Summaries and key points in seconds." },
  { icon: Layers, t: "Smart flashcards", d: "Spaced repetition that resurfaces cards right before you forget." },
  { icon: ListChecks, t: "Adaptive quizzes", d: "Active recall with explanations, generated from your own material." },
  { icon: Youtube, t: "YouTube learning", d: "Paste a link or search a topic and learn straight from video." },
  { icon: FileUp, t: "Any source", d: "PDF, DOCX and image/screenshot uploads with drag-and-drop." },
];

// Discrete page-transition controller: one scroll gesture (or key/swipe/dot)
// glides to the next full page with an eased transform + staged content reveal —
// a page hand-off, NOT a 1:1 continuous slide. Keeps the Nkae panel visuals.
function FullPage({ theme, toggleTheme, onStart, onSignin, pages, labels }) {
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const lock = useRef(false);
  const touchY = useRef(0);
  const n = pages.length;

  const go = useCallback((i) => {
    if (i < 0 || i >= n || lock.current || i === idxRef.current) return;
    lock.current = true;
    idxRef.current = i;
    setIdx(i);
    setTimeout(() => { lock.current = false; }, 900); // matches transition duration
  }, [n]);

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault();
      if (lock.current || Math.abs(e.deltaY) < 14) return;
      go(idxRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    const onKey = (e) => {
      if (["ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); go(idxRef.current + 1); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); go(idxRef.current - 1); }
    };
    const onTS = (e) => { touchY.current = e.touches[0].clientY; };
    const onTE = (e) => {
      const dy = touchY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) go(idxRef.current + (dy > 0 ? 1 : -1));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchend", onTE, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchend", onTE);
    };
  }, [go]);

  return (
    <div className="fp">
      {/* futuristic background field: animated aurora + tech grid + scanlines */}
      <div className="aurora"><i className="a1" /><i className="a2" /><i className="a3" /></div>
      <div className="grid-bg" />
      <div className="scan" />

      <div className="lnav">
        <div className="lnav-in">
          <div className="logo" onClick={() => go(0)}>
            <LogoMark size={38} />
          </div>
          <div className="row gap12">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="signin" onClick={onSignin || onStart}>Sign in</button>
          </div>
        </div>
      </div>

      <div className="fp-track" style={{ transform: `translateY(-${idx * 100}vh)` }}>
        {pages.map((p, i) => (
          <div key={i} className={`fp-sec ${p.bg || ""} ${i === idx ? "on" : ""}`}>
            {p.eyebrow && <div className="eyebrow">{p.eyebrow}</div>}
            {p.wm && <div className={`wm ${p.wmClass || ""}`}>{p.wm}</div>}
            {p.content}
            {i === 0 && (
              <div className="cue" style={{ cursor: "pointer" }} onClick={() => go(1)}>SCROLL <ChevronDown size={16} /></div>
            )}
          </div>
        ))}
      </div>

      <div className="dots">
        {labels.map((l, i) => (
          <button key={i} className={`dot ${i === idx ? "on" : ""}`} onClick={() => go(i)} aria-label={l}>
            <span className="lbl">{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Interactive hero note: click → flips to the "generating" side, runs the
// render/scan sequence, then flips back to reveal the answer.
function QuestionCard() {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [busy, setBusy] = useState(false);

  const click = () => {
    if (busy) return;
    setBusy(true);
    setFlipped(true);                       // flip to the generating side
    if (!answered) {
      setTimeout(() => { setAnswered(true); setFlipped(false); }, 1550); // render done → flip back w/ answer
      setTimeout(() => setBusy(false), 2300);
    } else {
      setTimeout(() => { setAnswered(false); setFlipped(false); }, 800); // reset back to the question
      setTimeout(() => setBusy(false), 1550);
    }
  };

  return (
    <div className="qcard hud" onClick={click} title="Click to flip">
      <div className={`flipcard ${flipped ? "flipped" : ""}`}>
        <div className="flipcard-inner">
          {/* FRONT — question, or the revealed answer */}
          <div className="xmut fc-face">
            <div className="xmut-bar">
              <span className="xdot" /> NOTE_04.TXT
              <span style={{ marginLeft: "auto", fontFamily: "ui-monospace,monospace", fontSize: 10.5, letterSpacing: 1.5, color: answered ? "var(--ok)" : "var(--muted)" }}>
                {answered ? "✓ ANSWER" : "QUESTION"}
              </span>
            </div>
            <div className="xmut-body">
              <div style={{ padding: 26 }}>
                <div className="q-tag">{answered ? "Answer" : "Question"}</div>
                <div className="q-text2">{answered ? "The mitochondria." : "What is the powerhouse of the cell?"}</div>
                {answered
                  ? <div className="q-ans">✓ Generated · click to reset</div>
                  : <div className="fc-hint"><RotateCw size={13} /> Click to generate the answer</div>}
              </div>
            </div>
          </div>
          {/* BACK — the render / scan sequence */}
          <div className="xmut fc-face fc-back">
            <div className="xmut-bar">
              <span className="xdot" style={{ background: "#c99b3e", boxShadow: "none" }} /> NOTE_04.TXT
              <span style={{ marginLeft: "auto", fontFamily: "ui-monospace,monospace", fontSize: 10.5, letterSpacing: 1.5, color: "var(--muted)" }}>● GENERATING</span>
            </div>
            <div className="xmut-body" style={{ position: "relative" }}>
              <div style={{ padding: 26 }}>
                <div className="scrawl">mitochondria = "powerhouse"</div>
                <div className="scrawl">makes ATP… energy??</div>
                <div className="scrawl">cell respiration ~ glucose</div>
                <div className="scrawl">→ inner membrane / cristae</div>
              </div>
              {flipped && <div className="xbeam-once" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Auto-playing hero pipeline that loops forever with no buttons:
// Question (always, left) → arrow → Generating fades in → arrow → Answer fades
// in → resets and replays. step: 0 question · 1 generating · 2 answer.
const QDEMO_Q = "What is the powerhouse of the cell?";
const QDEMO_OPTS = [
  { k: "A", t: "Nucleus" },
  { k: "B", t: "Mitochondria", correct: true },
  { k: "C", t: "Ribosome" },
];
function QuizDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const hold = [1700, 2200, 2900][step]; // question · generating · answer
    const id = setTimeout(() => setStep((s) => (s + 1) % 3), hold);
    return () => clearTimeout(id);
  }, [step]);

  // spotlight focus: only the current stage is sharp; earlier stages fade &
  // blur out ("past"), upcoming stages are not shown yet ("hidden").
  const cls = (i) => (step === i ? "focus" : step > i ? "past" : "hidden");

  return (
    <div className="qpipe">
      {/* Question */}
      <div className={`qp-node ${cls(0)}`}>
        <div className="qp-cap">Question</div>
        <div className="qp-q">{QDEMO_Q}</div>
        <div className="qp-opts">
          {QDEMO_OPTS.map((o) => (
            <div key={o.k} className="qp-opt">
              <span className="qp-k">{o.k}</span>
              <span className="qp-t">{o.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`qp-arr ${step >= 1 ? "on" : ""} ${step === 1 ? "flow" : ""}`}><ArrowRight size={22} /></div>

      {/* Generating */}
      <div className={`qp-node qp-mid ${cls(1)}`}>
        <div className="qp-cap">Generating</div>
        <Loader2 className="qp-spin" size={24} />
        <div className="qp-genlist">
          <div className="on"><Check size={11} /> Reading notes</div>
          <div className="on"><Check size={11} /> Key concepts</div>
          <div><span className="qp-dot" /> Writing answer</div>
        </div>
      </div>

      <div className={`qp-arr ${step >= 2 ? "on" : ""} ${step === 2 ? "flow" : ""}`}><ArrowRight size={22} /></div>

      {/* Answer */}
      <div className={`qp-node qp-ans ${cls(2)}`}>
        <div className="qp-cap ok">Answer</div>
        <div className="qp-ansrow">
          <span className="qp-k ok">B</span>
          <span className="qp-t">Mitochondria</span>
        </div>
        <div className="qp-ansmark">
          <Pencil size={12} /> Correct <Check size={13} />
          <svg className="qp-scribble" viewBox="0 0 130 10" preserveAspectRatio="none">
            <path d="M3 7 Q 28 2, 60 6 T 127 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Landing({ onStart, onSignin, theme, toggleTheme }) {
  const twoCol = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 44, alignItems: "center" };

  const pages = [
    // PAGE 1 — HERO (cream)
    {
      bg: "panel-cream", wmClass: "wm-brand", wm: (<NousMaxWord />),
      content: (
        <>
          <div className="pin hero-left">
            <div className="hero-col">
              <h1 className="display rise d1" style={{ marginBottom: 18, fontSize: "clamp(34px,4.8vw,58px)" }}>
                Study smarter,<br /><span className="amber">remember longer.</span>
              </h1>
              <p className="rise d2" style={{ fontSize: "clamp(16px,2vw,18px)", color: "var(--cream-muted)", lineHeight: 1.6, maxWidth: 480, margin: "0 0 30px" }}>
                Upload notes, drop a YouTube link, or search a topic — NousMax turns it into summaries, quizzes and flashcards, then brings them back at exactly the right moment.
              </p>
              <div className="rise d3">
                <button className="btn btn-primary" onClick={onStart}>Get started <ArrowRight size={18} /></button>
                <div style={{ marginTop: 12 }}>
                  <button onClick={onStart} style={{ background: "none", border: "none", color: "var(--cream-muted)", cursor: "pointer", textDecoration: "underline", fontSize: 13.5, padding: 0 }}>See how it works</button>
                </div>
                <div className="faint" style={{ marginTop: 12, fontSize: 12 }}>Free while in beta · your notes stay yours</div>
              </div>
            </div>
          </div>
        </>
      ),
    },
    // PAGE 2 — THE FLOW (alt dark)
    {
      bg: "panel-cream", eyebrow: "01 · THE FLOW", wm: "smarter",
      content: (
        <div className="pin center">
          <div className="rise d1">
            <div className="kicker" style={{ marginBottom: 18 }}>How it works</div>
            <h2 className="display" style={{ marginBottom: 54 }}>Three steps,<br />one <span className="amber">flow.</span></h2>
          </div>
          <div className="flow">
            {FLOW.map((s, i) => (
              <div key={i} className={`fnode rise d${i + 2}`}>
                <div className="ftile-lg glassx hud"><s.icon size={28} /><span className="fbadge">{i + 1}</span></div>
                <div>
                  <div style={{ fontWeight: 770, fontSize: 17, marginBottom: 6 }}>{s.t}</div>
                  <div className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // PAGE 3 — THE TOOLKIT (dark)
    {
      bg: "panel-cream", eyebrow: "02 · THE TOOLKIT", wm: "remember",
      content: (
        <div className="pin">
          <div style={{ ...twoCol, gap: 52 }}>
            <div>
              <div className="rise d1">
                <div className="kicker" style={{ marginBottom: 18 }}>What you get</div>
                <h2 className="display" style={{ marginBottom: 18 }}>Everything, from <span className="amber">one upload.</span></h2>
                <p className="p-sub" style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 420 }}>
                  One source becomes a complete study system — summaries, cards and quizzes, scheduled around how memory actually works.
                </p>
              </div>
            </div>
            <div>
              {TOOLS.map((f, i) => (
                <div key={i} className={`frow rise d${i + 2}`}>
                  <div className="ftile glassx"><f.icon size={22} /></div>
                  <div>
                    <div style={{ fontWeight: 760, fontSize: 16.5, color: "var(--cream-ink)", marginBottom: 3 }}>{f.t}</div>
                    <div className="p-sub" style={{ fontSize: 14.5, lineHeight: 1.5 }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // PAGE 4 — CTA (cream)
    {
      bg: "panel-cream", wm: "longer",
      content: (
        <div className="pin center">
          <div className="cta-card hud" style={{ borderRadius: 24, padding: "56px 40px", maxWidth: 620, margin: "0 auto", position: "relative" }}>
            <div className="rise d1" style={{ margin: "0 auto 24px", display: "grid", placeItems: "center" }}><LogoMark size={62} /></div>
            <h2 className="display rise d2" style={{ marginBottom: 30 }}>Start studying <span className="amber">today.</span></h2>
            <div className="rise d3"><button className="btn btn-primary" style={{ fontSize: 16, padding: "14px 26px" }} onClick={onStart}>Get started free <ArrowRight size={18} /></button></div>
            <div className="faint rise d4" style={{ marginTop: 40, fontSize: 12.5 }}>NousMax · Phase 1 prototype · built with mock data</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <FullPage theme={theme} toggleTheme={toggleTheme} onStart={onStart} onSignin={onSignin}
      pages={pages} labels={["Home", "The flow", "Toolkit", "Get started"]} />
  );
}


/* =========================================================================
   5) ONBOARDING — spotlight tour over the real workspace elements.
   ========================================================================= */
const TOUR = [
  { sel: "src-panel", title: "Add your source", body: "Start here. Upload a file, paste a YouTube link, or search a topic. Everything begins with a source." },
  { sel: "src-tabs", title: "Three ways in", body: "Switch between uploading a file, pasting a video, or searching for one — whatever fits your material." },
  { sel: "gen-panel", title: "Generate study tools", body: "Once a source is ready, these cards light up. One click turns it into a quiz, notes, or flashcards." },
  { sel: "lib-btn", title: "Your library", body: "Past sources live here so you can jump back in anytime. That's the whole tour — you're set!" },
];

function Tour({ step, setStep, onFinish, anchors }) {
  const [rect, setRect] = useState(null);
  const s = TOUR[step];

  useEffect(() => {
    const measure = () => {
      const el = anchors.current[s.sel];
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else setRect(null);
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 350);
    return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
  }, [step, s.sel, anchors]);

  // position the tour card near the spotlight (below, or centered if unknown)
  let cardStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  if (rect) {
    const below = rect.top + rect.height + 16;
    const spaceBelow = window.innerHeight - below;
    if (spaceBelow > 220) cardStyle = { top: below, left: Math.min(Math.max(rect.left, 16), window.innerWidth - 336) };
    else cardStyle = { top: Math.max(rect.top - 210, 16), left: Math.min(Math.max(rect.left, 16), window.innerWidth - 336) };
  }

  return (
    <>
      {rect ? <div className="spot" style={rect} /> : <div className="tour-mask" />}
      <div className="tour-card" style={cardStyle}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <span className="pill" style={{ fontSize: 11.5 }}>Step {step + 1} of {TOUR.length}</span>
          <button className="icon-btn btn-sm" style={{ width: 30, height: 30 }} onClick={onFinish} title="Skip tour"><X size={15} /></button>
        </div>
        <div style={{ fontWeight: 780, fontSize: 17, marginBottom: 6 }}>{s.title}</div>
        <div className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{s.body}</div>
        <div className="bar" style={{ marginBottom: 16 }}><i style={{ width: `${((step + 1) / TOUR.length) * 100}%` }} /></div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-sm" onClick={onFinish}>Skip</button>
          <div className="row gap8">
            {step > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</button>}
            {step < TOUR.length - 1
              ? <button className="btn btn-primary btn-sm" onClick={() => setStep(step + 1)}>Next <ChevronRight size={16} /></button>
              : <button className="btn btn-primary btn-sm" onClick={onFinish}>Finish <Check size={16} /></button>}
          </div>
        </div>
      </div>
    </>
  );
}

/* first-run welcome modal that precedes the spotlight tour */
function Welcome({ onTour, onSkip }) {
  return (
    <div className="tour-mask" style={{ display: "grid", placeItems: "center", padding: 16 }}>
      <div className="tour-card pop-in" style={{ position: "relative", width: 420, maxWidth: "100%", textAlign: "center" }}>
        <div className="bob" style={{ display: "grid", placeItems: "center", margin: "4px auto 14px" }}>
          <LogoMark size={58} />
        </div>
        <div style={{ fontWeight: 820, fontSize: 22, marginBottom: 8 }}>Welcome to NousMax</div>
        <div className="muted" style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 22 }}>
          Let's take a quick 4-step tour of the workspace so you know exactly where to start. It takes 20 seconds.
        </div>
        <div className="row gap12" style={{ justifyContent: "center" }}>
          <button className="btn btn-ghost" onClick={onSkip}>Skip for now</button>
          <button className="btn btn-primary" onClick={onTour}>Take the tour <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}


/* =========================================================================
   6) WORKSPACE — source panel (tabs) + generate panel
   ========================================================================= */
function SkeletonBlock({ h = 16, w = "100%", mb = 10 }) {
  return <div className="sk" style={{ height: h, width: w, marginBottom: mb }} />;
}

function VideoCard({ v, active, onPick }) {
  return (
    <div className="card card-h" onClick={onPick}
      style={{ overflow: "hidden", cursor: "pointer", outline: active ? "2px solid var(--primary)" : "none" }}>
      <div style={{ height: 120, background: `linear-gradient(135deg, ${v.tone}, color-mix(in srgb,${v.tone} 40%, #000))`, position: "relative", display: "grid", placeItems: "center" }}>
        <Play size={30} color="#fff" style={{ opacity: .9 }} />
        <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.7)", color: "#fff", fontSize: 12, padding: "2px 7px", borderRadius: 6 }}>{v.duration}</span>
        {active && <span style={{ position: "absolute", top: 8, left: 8, background: "var(--primary)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 999, display: "flex", gap: 4, alignItems: "center" }}><Check size={12} /> Source</span>}
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.35, marginBottom: 6 }}>{v.title}</div>
        <div className="faint row gap8" style={{ fontSize: 12.5 }}>{v.channel} · {v.views} views</div>
      </div>
    </div>
  );
}

function SourcePanel({ anchors, source, setSource, onToast }) {
  const [tab, setTab] = useState("upload");
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef(null);

  const acceptFile = async (name) => {
    setSource({ status: "processing", name: name || "Your document.pdf" });
    onToast("Uploading & processing…");
    const s = await mockProcessFile(name || "Your document.pdf"); // MOCK seam
    setSource({ status: "ready", ...s });
    onToast("Source ready ✓");
  };
  const acceptUrl = async () => {
    if (!url.trim()) return;
    setSource({ status: "processing", name: "YouTube video" });
    onToast("Fetching video…");
    const s = await mockFetchTranscript(url); // MOCK seam
    setSource({ status: "ready", ...s });
    onToast("Source ready ✓");
  };
  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResults(null);
    const r = await mockVideoSearch(query); // MOCK seam
    setResults(r); setSearching(false);
  };

  return (
    <div className="card" ref={(el) => (anchors.current["src-panel"] = el)} style={{ padding: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 780, fontSize: 19 }}>Add a source</div>
          <div className="muted" style={{ fontSize: 13.5 }}>Upload a file, paste a link, or search a topic.</div>
        </div>
        <div className="tabs" ref={(el) => (anchors.current["src-tabs"] = el)}>
          <button className={`tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}><Upload size={15} /> <span className="hide-sm">Upload</span></button>
          <button className={`tab ${tab === "youtube" ? "active" : ""}`} onClick={() => setTab("youtube")}><Youtube size={15} /> <span className="hide-sm">YouTube</span></button>
          <button className={`tab ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}><Search size={15} /> <span className="hide-sm">Search</span></button>
        </div>
      </div>

      {/* processing / ready state (shared) */}
      {source?.status === "processing" && (
        <div className="drop fade-in" style={{ borderStyle: "solid" }}>
          <Loader2 size={30} className="spin" style={{ color: "var(--primary)", marginBottom: 12 }} />
          <div style={{ fontWeight: 700 }}>Processing “{source.name}”…</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Preparing your source (mocked)</div>
        </div>
      )}

      {source?.status === "ready" && (
        <div className="card fade-in" style={{ padding: 18, background: "var(--surface2)", borderColor: "var(--border2)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
            <div className="row gap12">
              <span style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "var(--grad)", color: "#fff" }}>
                {source.kind === "video" ? <Youtube size={20} /> : <FileText size={20} />}
              </span>
              <div>
                <div className="row gap8" style={{ fontWeight: 720 }}>{source.name} <CheckCircle2 size={16} color="var(--ok)" /></div>
                <div className="faint" style={{ fontSize: 12.5 }}>{source.meta} · ready to generate</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSource(null)}><RefreshCw size={15} /> <span className="hide-sm">New</span></button>
          </div>
        </div>
      )}

      {/* tab bodies (only when no source in progress) */}
      {!source && tab === "upload" && (
        <div className={`drop ${drag ? "drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); acceptFile(e.dataTransfer.files?.[0]?.name); }}>
          <div className="bob" style={{ display: "grid", placeItems: "center", width: 58, height: 58, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border2)", margin: "0 auto 14px" }}>
            <FileUp size={26} style={{ color: "var(--primary)" }} />
          </div>
          <div style={{ fontWeight: 720, fontSize: 16 }}>Drag & drop your file here</div>
          <div className="muted" style={{ fontSize: 13.5, margin: "6px 0 16px" }}>PDF, DOCX or image · we'll never really parse it in Phase 1</div>
          <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>Browse files</button>
          <input ref={fileRef} type="file" hidden onChange={(e) => acceptFile(e.target.files?.[0]?.name)} />
        </div>
      )}

      {!source && tab === "youtube" && (
        <div className="fade-in">
          <div className="muted" style={{ fontSize: 13.5, marginBottom: 10 }}>Paste a YouTube link and we'll turn the video into a study source.</div>
          <div className="row gap12" style={{ flexWrap: "wrap" }}>
            <input className="input" style={{ flex: 1, minWidth: 220 }} placeholder="https://youtube.com/watch?v=…" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button className="btn btn-primary" onClick={acceptUrl}><Youtube size={17} /> Add video</button>
          </div>
        </div>
      )}

      {!source && tab === "search" && (
        <div className="fade-in">
          <div className="row gap12" style={{ flexWrap: "wrap", marginBottom: 16 }}>
            <input className="input" style={{ flex: 1, minWidth: 220 }} placeholder="Search a topic — e.g. photosynthesis"
              value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <button className="btn btn-primary" onClick={runSearch}><Search size={17} /> Search</button>
          </div>

          {searching && (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="card" style={{ overflow: "hidden" }}>
                  <div className="sk" style={{ height: 120, borderRadius: 0 }} />
                  <div style={{ padding: 14 }}><SkeletonBlock w="90%" /><SkeletonBlock w="55%" mb={0} /></div>
                </div>
              ))}
            </div>
          )}

          {!searching && results && (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {results.map((v) => (
                <VideoCard key={v.id} v={v} active={source?.id === v.id}
                  onPick={() => { setSource({ status: "ready", id: v.id, kind: "video", name: v.title, meta: `YouTube · ${v.duration}` }); onToast("Video set as source ✓"); }} />
              ))}
            </div>
          )}

          {!searching && !results && (
            <div className="center" style={{ padding: "30px 10px", color: "var(--faint)" }}>
              <Search size={28} style={{ marginBottom: 10, opacity: .6 }} />
              <div style={{ fontSize: 14 }}>Search a topic to see recommended videos.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const GEN = [
  { key: "quiz", icon: ListChecks, title: "Generate Quiz", body: "Multiple choice, true/false & short answer.", c: "var(--primary)" },
  { key: "summary", icon: StickyNote, title: "Summary Notes", body: "Clean, structured notes to study from.", c: "var(--accent)" },
  { key: "flashcards", icon: Layers, title: "Flashcards", body: "Flip-card deck for fast recall.", c: "var(--primary2)" },
];

function GeneratePanel({ anchors, ready, onGenerate, busyKey }) {
  return (
    <div ref={(el) => (anchors.current["gen-panel"] = el)}>
      <div className="row" style={{ justifyContent: "space-between", margin: "0 0 14px" }}>
        <div style={{ fontWeight: 780, fontSize: 19 }}>Generate study tools</div>
        {!ready && <span className="pill faint" style={{ fontSize: 12 }}><Clock size={13} /> Add a source first</span>}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        {GEN.map((g) => (
          <button key={g.key} disabled={!ready || busyKey}
            className={`card ${ready ? "card-h" : ""}`}
            onClick={() => onGenerate(g.key)}
            style={{ padding: 22, textAlign: "left", cursor: ready ? "pointer" : "not-allowed", opacity: ready ? 1 : .5, border: "1px solid var(--border)", background: "var(--surface)" }}>
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 13, background: g.c, color: "#fff", marginBottom: 14 }}>
              {busyKey === g.key ? <Loader2 size={22} className="spin" /> : <g.icon size={22} />}
            </span>
            <div style={{ fontWeight: 760, fontSize: 16.5, marginBottom: 5 }}>{g.title}</div>
            <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{busyKey === g.key ? "Generating…" : g.body}</div>
          </button>
        ))}
      </div>
    </div>
  );
}


/* =========================================================================
   7) OUTPUT VIEWS — Quiz, Summary, Flashcards
   ========================================================================= */
function QuizView({ data, onBack, onToast }) {
  const [pool, setPool] = useState(data.questions);
  const qs = pool;
  const [answers, setAnswers] = useState({});   // qid -> choice index / text
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);    // exam-mode timer

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [submitted, pool]);

  const score = qs.reduce((n, q) => {
    if (q.type === "short") return n; // short answer self-graded
    return n + (answers[q.id] === q.answer ? 1 : 0);
  }, 0);
  const gradable = qs.filter((q) => q.type !== "short").length;
  const answeredAll = qs.every((q) => answers[q.id] !== undefined && answers[q.id] !== "");
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const wrong = qs.filter((q) => q.type !== "short" && answers[q.id] !== q.answer);
  const restart = (questions) => { setPool(questions); setAnswers({}); setSubmitted(false); setElapsed(0); };

  return (
    <div className="fade-in">
      <ViewHeader icon={ListChecks} title={data.title} onBack={onBack} onToast={onToast}
        right={<span className="pill" style={{ fontSize: 12 }}><Clock size={13} /> {mmss}</span>} />
      {!submitted ? (
        <div className="grid gap16" style={{ gap: 16 }}>
          {qs.map((q, i) => (
            <div key={q.id} className="card" style={{ padding: 22 }}>
              <div className="row gap8" style={{ marginBottom: 14 }}>
                <span className="pill" style={{ fontSize: 11.5 }}>{q.type === "mcq" ? "Multiple choice" : q.type === "tf" ? "True / false" : "Short answer"}</span>
                <span className="faint" style={{ fontSize: 12.5 }}>Question {i + 1} of {qs.length}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16.5, marginBottom: 14 }}>{q.prompt}</div>
              {q.type === "short" ? (
                <input className="input" placeholder="Type your answer…" value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
              ) : (
                <div className="grid" style={{ gap: 10 }}>
                  {q.options.map((opt, oi) => {
                    const chosen = answers[q.id] === oi;
                    return (
                      <button key={oi} onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                        className="card" style={{
                          padding: "13px 16px", textAlign: "left", cursor: "pointer", fontSize: 15,
                          borderColor: chosen ? "var(--primary)" : "var(--border)",
                          background: chosen ? "color-mix(in srgb,var(--primary) 12%,var(--surface))" : "var(--surface)",
                        }}>
                        <span className="row gap12">
                          <span style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${chosen ? "var(--primary)" : "var(--border2)"}`, display: "grid", placeItems: "center" }}>
                            {chosen && <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--primary)" }} />}
                          </span>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-primary" disabled={!answeredAll} onClick={() => setSubmitted(true)} style={{ opacity: answeredAll ? 1 : .5 }}>
            Submit quiz <Check size={17} />
          </button>
        </div>
      ) : (
        <div className="fade-in">
          <div className="card center" style={{ padding: 32, marginBottom: 18, background: "var(--grad)" }}>
            <Trophy size={34} color="#fff" style={{ marginBottom: 10 }} />
            <div style={{ color: "#fff", fontSize: 30, fontWeight: 850 }}>{score} / {gradable}</div>
            <div style={{ color: "rgba(255,255,255,.9)", marginTop: 4 }}>auto-graded questions correct · short answers are self-checked</div>
          </div>
          <div className="grid gap16" style={{ gap: 14 }}>
            {qs.map((q, i) => {
              const correct = q.type !== "short" && answers[q.id] === q.answer;
              return (
                <div key={q.id} className="card" style={{ padding: 20 }}>
                  <div className="row gap8" style={{ marginBottom: 8 }}>
                    {q.type === "short"
                      ? <Lightbulb size={18} color="var(--accent)" />
                      : correct ? <CheckCircle2 size={18} color="var(--ok)" /> : <X size={18} color="var(--danger)" />}
                    <span style={{ fontWeight: 700 }}>{q.prompt}</span>
                  </div>
                  {q.type !== "short" && (
                    <div className="muted" style={{ fontSize: 14, marginBottom: 6 }}>
                      Your answer: <b style={{ color: correct ? "var(--ok)" : "var(--danger)" }}>{q.options[answers[q.id]]}</b>
                      {!correct && <> · Correct: <b style={{ color: "var(--ok)" }}>{q.options[q.answer]}</b></>}
                    </div>
                  )}
                  {q.type === "short" && (
                    <div className="muted" style={{ fontSize: 14, marginBottom: 6 }}>Model answer: <b>{q.answer}</b></div>
                  )}
                  <div className="faint" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{q.explanation}</div>
                </div>
              );
            })}
          </div>
          <div className="row gap12" style={{ marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => restart(data.questions)}><RotateCw size={16} /> Retake quiz</button>
            {wrong.length > 0 && (
              <button className="btn btn-primary" onClick={() => { restart(wrong); onToast && onToast("Practicing the ones you missed"); }}>
                <Target size={16} /> Practice wrong ones ({wrong.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryView({ data, onBack, onToast }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    const synth = typeof window !== "undefined" && window.speechSynthesis;
    if (!synth) { onToast && onToast("Audio not supported here"); return; }
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const text = data.sections.map((s) => `${s.heading}. ${s.body} ${s.points.join(". ")}`).join(" ");
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.onend = () => setSpeaking(false);
    synth.cancel(); synth.speak(u); setSpeaking(true);
  };
  useEffect(() => () => { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); }, []);
  return (
    <div className="fade-in">
      <ViewHeader icon={StickyNote} title={data.title} onBack={onBack} onToast={onToast}
        right={<span className="row gap8"><button className="btn btn-ghost btn-sm" onClick={speak}>{speaking ? <><Pause size={14} /> Stop</> : <><Volume2 size={14} /> Listen</>}</button><span className="pill hide-sm" style={{ fontSize: 12 }}><Clock size={13} /> {data.readingTime}</span></span>} />
      <div className="card" style={{ padding: "34px 34px 26px", maxWidth: 780, margin: "0 auto" }}>
        {data.sections.map((s, i) => (
          <Reveal key={i} delay={i * 60}>
            <div style={{ marginBottom: 26 }}>
              <div className="row gap8" style={{ marginBottom: 8 }}>
                <span style={{ width: 8, height: 22, borderRadius: 4, background: "var(--grad)" }} />
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 780, letterSpacing: "-.3px" }}>{s.heading}</h3>
              </div>
              <p style={{ margin: "0 0 10px", color: "var(--muted)", fontSize: 15.5, lineHeight: 1.65 }}>{s.body}</p>
              {s.points.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {s.points.map((p, k) => (
                    <li key={k} className="row gap8" style={{ alignItems: "flex-start", marginBottom: 7, fontSize: 15, lineHeight: 1.55 }}>
                      <Check size={17} style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} /> <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function FlashcardsView({ data, onBack, onToast }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const cards = data.cards;
  const go = (d) => { setFlipped(false); setTimeout(() => setI((v) => (v + d + cards.length) % cards.length), 120); };
  const markKnown = () => { const n = new Set(known); n.add(cards[i].id); setKnown(n); go(1); };

  return (
    <div className="fade-in">
      <ViewHeader icon={Layers} title={data.title} onBack={onBack} onToast={onToast} right={<span className="pill" style={{ fontSize: 12 }}>{known.size}/{cards.length} learned</span>} />
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="bar" style={{ marginBottom: 20 }}><i style={{ width: `${((i + 1) / cards.length) * 100}%` }} /></div>

        <div className={`flip ${flipped ? "flipped" : ""}`} style={{ height: 300, cursor: "pointer" }} onClick={() => setFlipped(!flipped)}>
          <div className="flip-inner">
            <div className="flip-face flip-front">
              <div>
                <div className="faint" style={{ fontSize: 12.5, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Question</div>
                <div style={{ fontSize: 22, fontWeight: 720, lineHeight: 1.35 }}>{cards[i].front}</div>
                <div className="faint row gap8" style={{ justifyContent: "center", marginTop: 20, fontSize: 13 }}><RotateCw size={14} /> Click to flip</div>
              </div>
            </div>
            <div className="flip-face flip-back">
              <div>
                <div style={{ fontSize: 12.5, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, opacity: .85 }}>Answer</div>
                <div style={{ fontSize: 20, fontWeight: 640, lineHeight: 1.45 }}>{cards[i].back}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginTop: 22 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => go(-1)}><ChevronLeft size={16} /> Prev</button>
          <div className="row gap8">
            <span className="pill">{i + 1} / {cards.length}</span>
            <button className="btn btn-primary btn-sm" onClick={markKnown}><Check size={15} /> Got it</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => go(1)}>Next <ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function ViewHeader({ icon: Icon, title, onBack, right, onToast }) {
  const share = () => {
    try { navigator.clipboard && navigator.clipboard.writeText(typeof location !== "undefined" ? location.href : "studyforge"); } catch (e) { /* noop */ }
    onToast && onToast("Share link copied ✓");
  };
  return (
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div className="row gap12">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ChevronLeft size={16} /> Back</button>
        <div className="row gap8" style={{ fontWeight: 780, fontSize: 18 }}><Icon size={20} style={{ color: "var(--primary)" }} /> {title}</div>
      </div>
      <div className="row gap8">
        {right}
        <button className="btn btn-ghost btn-sm" onClick={share}><Share2 size={15} /> <span className="hide-sm">Share</span></button>
      </div>
    </div>
  );
}


/* =========================================================================
   8) LIBRARY (mock list of past sources)
   ========================================================================= */
function LibraryDrawer({ open, onClose, onPick }) {
  if (!open) return null;
  return (
    <>
      <div className="tour-mask" style={{ zIndex: 60 }} onClick={onClose} />
      <div className="glass" style={{ position: "fixed", top: 0, right: 0, height: "100%", width: 380, maxWidth: "90vw", zIndex: 61, borderLeft: "1px solid var(--border2)", padding: 22, animation: "pop .3s ease" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
          <div className="row gap8" style={{ fontWeight: 780, fontSize: 18 }}><Library size={19} /> Library</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><X size={17} /></button>
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Your past sources (mock data)</div>
        <div className="grid" style={{ gap: 10 }}>
          {mockSources.map((s) => (
            <button key={s.id} className="card card-h" onClick={() => onPick(s)}
              style={{ padding: 14, textAlign: "left", cursor: "pointer", background: "var(--surface)" }}>
              <div className="row gap12">
                <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 11, background: s.kind === "video" ? "var(--accent)" : "var(--primary)", color: "#fff", flexShrink: 0 }}>
                  {s.kind === "video" ? <Youtube size={18} /> : <FileText size={18} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 680, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{s.meta} · {s.addedAt}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}


/* =========================================================================
   9) WORKSPACE PAGE (ties source + generate + output views together)
   ========================================================================= */
function EmptyOutput() {
  return (
    <div className="card center" style={{ padding: "44px 24px", borderStyle: "dashed" }}>
      <div className="bob" style={{ width: 56, height: 56, borderRadius: 15, background: "var(--surface2)", border: "1px solid var(--border2)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
        <Sparkles size={24} style={{ color: "var(--primary)" }} />
      </div>
      <div style={{ fontWeight: 720, fontSize: 16 }}>Your study tools will appear here</div>
      <div className="muted" style={{ fontSize: 14, marginTop: 6, maxWidth: 380, marginInline: "auto", lineHeight: 1.5 }}>
        Add a source above, then hit Generate. Quizzes, notes and flashcards will show up right here.
      </div>
    </div>
  );
}

/* ---- workspace section nav ---- */
function SectionNav({ section, setSection, due }) {
  const items = [
    { k: "sources", label: "Sources", icon: FileUp },
    { k: "review", label: "Review", icon: Layers, badge: due },
    { k: "focus", label: "Focus", icon: Timer },
    { k: "progress", label: "Progress", icon: TrendingUp },
    { k: "chat", label: "Chat", icon: MessageSquare },
  ];
  return (
    <div className="secnav">
      {items.map((it) => (
        <button key={it.k} className={section === it.k ? "on" : ""} onClick={() => setSection(it.k)}>
          <it.icon size={16} /> {it.label}
          {it.badge ? <span className="badge">{it.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

/* ---- spaced-repetition review (SM-2-lite; works client-side) ---- */
function ReviewView({ deck, onReviewed }) {
  const cards = deck?.cards || mockFlashcards.cards;
  const total = cards.length;
  const [remaining, setRemaining] = useState(cards.map((c) => c.id));
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const current = cards.find((c) => c.id === remaining[0]);

  const grade = (again) => {
    setFlipped(false);
    setDone((d) => d + 1);
    onReviewed && onReviewed();
    setRemaining((prev) => { const [head, ...rest] = prev; return again ? [...rest, head] : rest; });
  };

  if (!current) {
    return (
      <div className="card center" style={{ padding: 46 }}>
        <div className="mark bob" style={{ width: 58, height: 58, borderRadius: 16, margin: "0 auto 16px" }}><CheckCircle2 size={28} /></div>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>All caught up 🎉</div>
        <div className="muted" style={{ fontSize: 14.5 }}>You reviewed {done} cards. Come back tomorrow — spaced repetition brings them back at the right moment.</div>
        <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => { setRemaining(cards.map((c) => c.id)); setDone(0); }}><RotateCw size={16} /> Review again</button>
      </div>
    );
  }
  const grades = [{ t: "Again", s: "<1m", again: true }, { t: "Hard", s: "10m", again: false }, { t: "Good", s: "1d", again: false }, { t: "Easy", s: "4d", again: false }];
  return (
    <div className="fade-in" style={{ maxWidth: 620, margin: "0 auto" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="row gap8" style={{ fontWeight: 780, fontSize: 18 }}><Layers size={20} style={{ color: "var(--primary)" }} /> Review · spaced repetition</div>
        <span className="pill">{remaining.length} due · {done}/{total} done</span>
      </div>
      <div className="bar" style={{ marginBottom: 20 }}><i style={{ width: `${(done / total) * 100}%` }} /></div>
      <div className={`flip ${flipped ? "flipped" : ""}`} style={{ height: 280, cursor: "pointer" }} onClick={() => setFlipped(!flipped)}>
        <div className="flip-inner">
          <div className="flip-face flip-front"><div><div className="faint" style={{ fontSize: 12, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Prompt</div><div style={{ fontSize: 22, fontWeight: 720, lineHeight: 1.35 }}>{current.front}</div><div className="faint row gap8" style={{ justifyContent: "center", marginTop: 18, fontSize: 13 }}><RotateCw size={14} /> tap to reveal</div></div></div>
          <div className="flip-face flip-back"><div><div style={{ fontSize: 12, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, opacity: .85 }}>Answer</div><div style={{ fontSize: 20, fontWeight: 640, lineHeight: 1.45 }}>{current.back}</div></div></div>
        </div>
      </div>
      {flipped ? (
        <div className="grade">{grades.map((g) => <button key={g.t} onClick={() => grade(g.again)}>{g.t}<b>{g.s}</b></button>)}</div>
      ) : (
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} onClick={() => setFlipped(true)}>Show answer</button>
      )}
    </div>
  );
}

/* ---- focus / pomodoro timer (client-side) ---- */
function FocusView({ onSession }) {
  const LEN = 25 * 60;
  const [secs, setSecs] = useState(LEN);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { setRunning(false); setSessions((x) => x + 1); onSession && onSession(); return LEN; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]); // eslint-disable-line
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const C = 2 * Math.PI * 104;
  const off = C * (secs / LEN);
  return (
    <div className="fade-in" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
      <div className="row gap8" style={{ justifyContent: "center", fontWeight: 780, fontSize: 18, marginBottom: 6 }}><Timer size={20} style={{ color: "var(--primary)" }} /> Focus session</div>
      <div className="muted" style={{ fontSize: 14, marginBottom: 26 }}>Pomodoro · 25 min deep work, then a break.</div>
      <div className="pomo">
        <svg width="236" height="236" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="118" cy="118" r="104" fill="none" stroke="var(--surface2)" strokeWidth="14" />
          <circle cx="118" cy="118" r="104" fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="time">{mm}:{ss}</div>
      </div>
      <div className="row gap12" style={{ justifyContent: "center", marginTop: 26 }}>
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={17} /> Pause</> : <><Play size={17} /> Start</>}</button>
        <button className="btn btn-ghost" onClick={() => { setRunning(false); setSecs(LEN); }}><RotateCw size={16} /> Reset</button>
      </div>
      <div className="muted" style={{ marginTop: 22, fontSize: 13.5 }}>{sessions} session{sessions === 1 ? "" : "s"} completed today · keep the streak alive 🔥</div>
    </div>
  );
}

/* ---- progress: streak + heatmap + stats ---- */
function ProgressView({ stats }) {
  const [heat] = useState(() => Array.from({ length: 18 * 7 }, (_, k) => (k > 100 ? Math.floor(Math.random() * 5) : Math.random() < 0.5 ? Math.floor(Math.random() * 5) : 0)));
  const cell = (v) => (v <= 0 ? "" : v === 1 ? "l1" : v === 2 ? "l2" : v === 3 ? "l3" : "l4");
  return (
    <div className="fade-in">
      <div className="row gap8" style={{ fontWeight: 780, fontSize: 18, marginBottom: 20 }}><TrendingUp size={20} style={{ color: "var(--primary)" }} /> Your progress</div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 22 }}>
        <div className="stat"><div className="row gap8" style={{ color: "var(--amber)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}><Flame size={16} /> STREAK</div><div className="big">{stats.streak} <span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600 }}>days</span></div></div>
        <div className="stat"><div className="row gap8" style={{ color: "var(--primary2)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}><Layers size={16} /> CARDS LEARNED</div><div className="big">{stats.cardsLearned}</div></div>
        <div className="stat"><div className="row gap8" style={{ color: "var(--primary2)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}><Target size={16} /> QUIZ ACCURACY</div><div className="big">{stats.quizAcc}%</div></div>
        <div className="stat"><div className="row gap8" style={{ color: "var(--primary2)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}><Timer size={16} /> FOCUS SESSIONS</div><div className="big">{stats.focus}</div></div>
      </div>
      <div className="card" style={{ padding: 22, overflow: "hidden" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 750, fontSize: 15 }}>Study activity</div>
          <div className="faint" style={{ fontSize: 12.5 }}>last 18 weeks</div>
        </div>
        <div className="heat">{heat.map((v, k) => <i key={k} className={cell(v)} />)}</div>
      </div>
    </div>
  );
}

/* ---- chat with your notes (mock in preview; real LLM via SF_API when deployed) ---- */
function ChatView({ source }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: "Ask me anything about your source — I'll answer from it." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [msgs, busy]);

  const mockAnswer = (q) =>
    `Based on ${source?.name || "your notes"}: ${q.trim().replace(/\?+$/, "")} relates to the key concepts in the source. ` +
    "(This is a mock answer — once deployed, NousMax answers from the real extracted text via the LLM.)";

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "me", text: q }]);
    setInput(""); setBusy(true);
    try {
      const text = globalThis.SF_API?.chat ? await globalThis.SF_API.chat(source?.id, q) : (await new Promise((r) => setTimeout(() => r(mockAnswer(q)), 650)));
      setMsgs((m) => [...m, { role: "ai", text }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="row gap8" style={{ fontWeight: 780, fontSize: 18, marginBottom: 16 }}><MessageSquare size={20} style={{ color: "var(--primary)" }} /> Chat with your notes</div>
      <div className="card chat" style={{ padding: 18 }}>
        <div className="chat-log" ref={logRef}>
          {msgs.map((m, k) => <div key={k} className={`bub ${m.role}`}>{m.text}</div>)}
          {busy && <div className="bub ai"><Loader2 size={15} className="spin" /></div>}
        </div>
        <div className="row gap8" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Ask about your source…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="btn btn-primary" onClick={send} disabled={busy}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function Workspace({ anchors, onOpenLibrary, libraryPick, clearLibraryPick, onToast }) {
  const [source, setSource] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [view, setView] = useState(null);         // 'quiz' | 'summary' | 'flashcards'
  const [payload, setPayload] = useState(null);
  const [section, setSection] = useState("sources"); // sources | review | focus | progress | chat
  const [study, setStudy] = useState({ streak: 6, cardsLearned: 128, quizAcc: 82, focus: 9 });

  // if a library item was picked, set it as the ready source
  useEffect(() => {
    if (libraryPick) {
      setSource({ status: "ready", ...libraryPick });
      setView(null);
      clearLibraryPick();
      onToast(`Loaded “${libraryPick.name}”`);
    }
  }, [libraryPick, clearLibraryPick, onToast]);

  const generate = async (key) => {
    setBusyKey(key);
    const fn = key === "quiz" ? mockGenerateQuiz : key === "summary" ? mockGenerateSummary : mockGenerateFlashcards;
    const data = await fn(); // MOCK seam
    setPayload(data); setView(key); setBusyKey(null);
    onToast("Generated ✓");
  };

  const ready = source?.status === "ready";

  return (
    <div className="wrap" style={{ padding: "30px 22px 80px" }}>
      {view ? (
        view === "quiz" ? <QuizView data={payload} onBack={() => setView(null)} onToast={onToast} />
          : view === "summary" ? <SummaryView data={payload} onBack={() => setView(null)} onToast={onToast} />
            : <FlashcardsView data={payload} onBack={() => setView(null)} onToast={onToast} />
      ) : (
        <>
          <SectionNav section={section} setSection={setSection} due={5} />
          {section === "sources" ? (
            <div className="grid" style={{ gap: 24 }}>
              <SourcePanel anchors={anchors} source={source} setSource={setSource} onToast={onToast} />
              <GeneratePanel anchors={anchors} ready={ready} onGenerate={generate} busyKey={busyKey} />
              {!ready && <EmptyOutput />}
            </div>
          ) : section === "review" ? <ReviewView deck={mockFlashcards} onReviewed={() => setStudy((s) => ({ ...s, cardsLearned: s.cardsLearned + 1 }))} />
            : section === "focus" ? <FocusView onSession={() => setStudy((s) => ({ ...s, focus: s.focus + 1 }))} />
              : section === "progress" ? <ProgressView stats={study} />
                : <ChatView source={source} />}
        </>
      )}
    </div>
  );
}


/* =========================================================================
   9b) INTRO — draws the logo, then flies it to its spot in the nav.
   Measures the real nav logo at runtime so the landing is pixel-precise.
   ========================================================================= */
// The intro. A pencil genuinely traces the graduation-cap logo stroke-by-stroke
// (its tip follows getPointAtLength along each path as the stroke is revealed),
// the mark then colours in, the wordmark is written under the moving pencil, and
// finally the finished logo flies up into the nav.
function IntroOverlay({ onReveal, onDone }) {
  const bgRef = useRef(null);
  const logoRef = useRef(null);
  const markRef = useRef(null);
  const tileRef = useRef(null);
  const wordRef = useRef(null);
  const pencilRef = useRef(null);

  useEffect(() => {
    const logo = logoRef.current, bg = bgRef.current, markSvg = markRef.current;
    const tile = tileRef.current, word = wordRef.current, pencil = pencilRef.current;
    if (!logo || !markSvg) return;

    const paths = Array.from(markSvg.querySelectorAll("path.cap"));
    const lens = paths.map((p) => p.getTotalLength());
    paths.forEach((p, i) => { p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i]; });
    const total = lens.reduce((a, b) => a + b, 0) || 1;

    const ctm = markSvg.getScreenCTM();
    const spt = markSvg.createSVGPoint();
    const box0 = logo.getBoundingClientRect();
    const toLocal = (pt) => { spt.x = pt.x; spt.y = pt.y; const s = spt.matrixTransform(ctm); return { x: s.x - box0.left, y: s.y - box0.top }; };
    const place = (loc, rot) => { pencil.style.transform = `translate(${loc.x - 18}px, ${loc.y - 42}px) rotate(${rot}deg)`; };
    const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    let raf = 0; const timers = [];
    pencil.style.opacity = "1";
    place(toLocal(paths[0].getPointAtLength(0)), 22);

    const DRAW = 1450;
    let t0 = 0;
    const drawFrame = (ts) => {
      if (!t0) t0 = ts;
      const t = Math.min(1, (ts - t0) / DRAW);
      const drawn = easeIO(t) * total;
      let acc = 0;
      for (let i = 0; i < paths.length; i++) {
        if (drawn <= acc + lens[i] || i === paths.length - 1) {
          const local = Math.max(0, Math.min(lens[i], drawn - acc));
          paths[i].style.strokeDashoffset = lens[i] - local;
          for (let j = 0; j < i; j++) paths[j].style.strokeDashoffset = 0;
          place(toLocal(paths[i].getPointAtLength(local)), 22 + Math.sin(t * 26) * 3);
          break;
        }
        acc += lens[i];
      }
      if (t < 1) raf = requestAnimationFrame(drawFrame); else afterDraw();
    };

    // The seamless morph: the drawn NM monogram separates (N left, M right) and
    // fades, while a full-size "NousMax" grows out of it and settles into the giant
    // faded watermark that lives behind the hero — the logo literally becomes the
    // background name. The overlay then dissolves onto the identical page watermark.
    const afterDraw = () => {
      pencil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" });
      timers.push(setTimeout(morph, 160));
    };

    const morph = () => {
      const morphEl = document.querySelector(".intro-morph");
      // the monogram pushes BACK, then fades as the word expands out of it
      markSvg.animate([
        { transform: "scale(1)", opacity: 1, offset: 0 },
        { transform: "scale(.78)", opacity: 1, offset: .32 },
        { transform: "scale(1.05)", opacity: 0, offset: 1 },
      ], { duration: 900, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      if (paths[0]) paths[0].animate([{ transform: "translateX(0)" }, { transform: "translateX(-40px)" }], { duration: 900, easing: "ease", fill: "forwards" });
      if (paths[1]) paths[1].animate([{ transform: "translateX(0)" }, { transform: "translateX(40px)" }], { duration: 900, easing: "ease", fill: "forwards" });
      if (morphEl) {
        morphEl.classList.add("play");              // the o-u-s and a-x get drawn (stroke) like the NM
        morphEl.animate([
          { opacity: 0, transform: "scale(.6)", offset: 0 },
          { opacity: 0.16, transform: "scale(.86)", offset: .32 },   // pushed back
          { opacity: 0.16, transform: "scale(1)", offset: 1 },       // then expands
        ], { duration: 1900, easing: "cubic-bezier(.3,.6,.2,1)", fill: "forwards" });
        timers.push(setTimeout(() => morphEl.classList.add("fill"), 1350));   // ink fills the drawn outline
      }
      onReveal && onReveal();                       // page pulls into focus, hero rises on the left
      timers.push(setTimeout(reveal, 2050));
    };

    const reveal = () => {
      if (bg) bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: "ease", fill: "forwards" });
      timers.push(setTimeout(finish, 780));
    };

    const finish = () => {
      // hand the (identical) word over to the page watermark, then bring in the nav
      const morphEl = document.querySelector(".intro-morph");
      if (morphEl) morphEl.animate([{ opacity: 0.16 }, { opacity: 0 }], { duration: 450, easing: "ease", fill: "forwards" });
      onDone && onDone();
    };

    raf = requestAnimationFrame(drawFrame);
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="intro">
      <div className="intro-bg" ref={bgRef} />
      <div className="intro-morph" aria-hidden="true"><NousMaxWord /></div>
      <div className="intro-logo" ref={logoRef}>
        <span className="intro-mark">
          <svg ref={markRef} className="intro-cap" width="150" height="150" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <path className="cap" d="M22 74 L22 26 L54 74 L54 26" stroke="#0d9488" strokeWidth="11" />
            <path className="cap" d="M42 74 L42 26 L58 52 L74 26 L74 74" stroke="#d9a521" strokeWidth="11" opacity="0.85" />
          </svg>
        </span>
        {/* the pencil — its tip (18,42 in its own box) is placed on the drawing point each frame */}
        <span className="intro-pencil" ref={pencilRef} aria-hidden="true">
          <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
            <g transform="translate(12 2)">
              <rect x="0" y="0" width="12" height="4.5" rx="1.4" fill="#f2a2b0" />
              <rect x="0" y="4.5" width="12" height="3" fill="#c9ccd4" />
              <rect x="0" y="7.5" width="12" height="21.5" fill="#f4c25a" />
              <rect x="0" y="7.5" width="4" height="21.5" fill="#e6ad33" />
              <rect x="8" y="7.5" width="4" height="21.5" fill="#dc9f22" opacity=".55" />
              <polygon points="0,29 12,29 6,40" fill="#efd8ac" />
              <polygon points="0,29 6,29 6,40" fill="#dcc294" />
              <polygon points="3,35.4 9,35.4 6,40.6" fill="#2b2b2b" />
            </g>
          </svg>
        </span>
      </div>
    </div>
  );
}


/* =========================================================================
   9c) AUTH — sign-up / sign-in screen. UI ONLY (mock). No real auth; the
   form just proceeds into the app. Phase 2 wires a real provider here.
   ========================================================================= */
function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.3 44 30.7 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
  );
}

function AuthModal({ mode, setMode, onClose, onAuthed }) {
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const api = typeof globalThis !== "undefined" ? globalThis.SF_API : null; // set only when deployed

  const google = async () => {
    setErr("");
    if (!api) return onAuthed();                 // preview: no backend → just enter the app
    try { await api.auth.google(); }             // real Google OAuth (redirects)
    catch (e) { setErr(e.message || "Google sign-in failed."); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!api) return onAuthed();                 // preview mock
    setBusy(true);
    try {
      const { error } = signup
        ? await api.auth.signUp(email, password, name)
        : await api.auth.signIn(email, password);
      if (error) throw error;
      onAuthed();
    } catch (e2) { setErr(e2.message || "Authentication failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="tour-mask auth-mask" style={{ zIndex: 120 }} onClick={onClose}>
      <div className="authcard glassx hud pop-in" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn" style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34 }} onClick={onClose} aria-label="Close"><X size={16} /></button>
        <div style={{ display: "grid", placeItems: "center", margin: "0 auto 14px" }}><LogoMark size={48} /></div>
        <h2 style={{ textAlign: "center", fontSize: 23, fontWeight: 820, letterSpacing: "-.5px", margin: "0 0 6px" }}>
          {signup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="muted" style={{ textAlign: "center", fontSize: 14, margin: "0 0 22px" }}>
          {signup ? "Start turning your notes into study tools." : "Sign in to pick up where you left off."}
        </p>

        <button className="btn btn-ghost" type="button" style={{ width: "100%", justifyContent: "center", marginBottom: 14 }} onClick={google}>
          <GoogleG /> Continue with Google
        </button>
        <div className="auth-div"><span>or</span></div>

        <form onSubmit={submit}>
          {signup && <input className="input" style={{ marginBottom: 12 }} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />}
          <input className="input" type="email" style={{ marginBottom: 12 }} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" style={{ marginBottom: 14 }} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <div style={{ color: "var(--danger)", fontSize: 13, lineHeight: 1.4, marginBottom: 12, textAlign: "center" }}>{err}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Please wait…" : (signup ? "Create account" : "Sign in")} <ArrowRight size={17} />
          </button>
        </form>

        <div className="muted" style={{ textAlign: "center", fontSize: 13.5, marginTop: 18 }}>
          {signup ? "Already have an account? " : "New to NousMax? "}
          <button className="linklike" onClick={() => { setErr(""); setMode(signup ? "signin" : "signup"); }}>
            {signup ? "Sign in" : "Create account"}
          </button>
        </div>
        <div className="faint" style={{ textAlign: "center", fontSize: 10.5, marginTop: 16, fontFamily: "ui-monospace,monospace", letterSpacing: 1.2 }}>
          {api ? "SECURED BY SUPABASE AUTH" : "PREVIEW · MOCK — DEPLOY FOR REAL LOGIN"}
        </div>
      </div>
    </div>
  );
}


/* =========================================================================
   10) APP ROOT — theme state, routing between landing & workspace, tour
   ========================================================================= */
export default function App() {
  // Phase 2 note: persist theme + "seen tour" to storage. Held in React state for now.
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("landing");     // 'landing' | 'app'
  const [welcome, setWelcome] = useState(false);
  const [tourStep, setTourStep] = useState(null);   // number | null
  const [seenTour, setSeenTour] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [libPick, setLibPick] = useState(null);
  const [toast, setToast] = useState(null);
  const [intro, setIntro] = useState(true);         // overlay mounted
  const [booting, setBooting] = useState(true);     // hero held + blurred until the reveal
  const [navUp, setNavUp] = useState(false);        // nav chrome shown only after the whole intro
  const [wmOn, setWmOn] = useState(false);          // page watermark takes over from the intro word
  const [auth, setAuth] = useState(null);           // null | 'signup' | 'signin'  (mock)
  const anchors = useRef({});

  const anchorLibBtn = useRef(null);
  useEffect(() => { anchors.current["lib-btn"] = anchorLibBtn.current; });

  const fireToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 1800);
  }, []);

  const enterApp = () => {
    setPage("app");
    window.scrollTo({ top: 0 });
    if (!seenTour) setTimeout(() => setWelcome(true), 500);
  };
  const startTour = () => { setWelcome(false); setTourStep(0); };
  const finishTour = () => { setTourStep(null); setSeenTour(true); };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className={`sf ${theme === "light" ? "light" : ""} ${intro ? "intro-active" : ""} ${booting ? "booting" : ""} ${navUp ? "nav-up" : ""} ${wmOn ? "wm-on" : ""}`}>
      <style>{CSS}</style>

      {intro && <IntroOverlay onReveal={() => setBooting(false)} onDone={() => { setWmOn(true); setNavUp(true); setTimeout(() => setIntro(false), 480); }} />}

      {page === "landing" ? (
        // Landing owns its own fixed nav (theme toggle) and full-page slider.
        <Landing onStart={() => setAuth("signup")} onSignin={() => setAuth("signin")}
          theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <>
          <Nav theme={theme} toggleTheme={toggleTheme}
            onLogo={() => setPage("landing")} showApp
            onOpenLibrary={() => setLibOpen(true)} />

          {/* library button anchor (invisible marker near nav for the tour spotlight) */}
          <span ref={anchorLibBtn} style={{ position: "fixed", top: 14, right: 76, width: 40, height: 40, pointerEvents: "none" }} />

          <Workspace anchors={anchors} onOpenLibrary={() => setLibOpen(true)}
            libraryPick={libPick} clearLibraryPick={() => setLibPick(null)} onToast={fireToast} />
        </>
      )}

      {auth && <AuthModal mode={auth} setMode={setAuth} onClose={() => setAuth(null)}
        onAuthed={() => { setAuth(null); enterApp(); }} />}

      {welcome && <Welcome onTour={startTour} onSkip={() => { setWelcome(false); setSeenTour(true); }} />}
      {tourStep !== null && <Tour step={tourStep} setStep={setTourStep} onFinish={finishTour} anchors={anchors} />}

      <LibraryDrawer open={libOpen} onClose={() => setLibOpen(false)}
        onPick={(s) => { setLibPick(s); setLibOpen(false); if (page !== "app") setPage("app"); }} />

      {toast && <div className="toast"><CheckCircle2 size={17} color="var(--ok)" /> {toast}</div>}
    </div>
  );
}
