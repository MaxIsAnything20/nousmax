import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun, Moon, Sparkles, Upload, Youtube, Search, FileText, Layers,
  BrainCircuit, ArrowRight, Check, X, ChevronLeft, ChevronRight,
  RotateCw, Play, GraduationCap, Zap, Library, Plus, CheckCircle2,
  Loader2, RefreshCw, Trophy, Lightbulb, ListChecks, StickyNote,
  Clock, FileUp, MousePointerClick, ChevronDown, ArrowDown,
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
  { id: "v1", title: "Photosynthesis: Crash Course Biology", channel: "CrashCourse", duration: "13:14", views: "9.2M", tone: "#7c3aed" },
  { id: "v2", title: "How Plants Make Food — Full Lesson", channel: "Amoeba Sisters", duration: "8:41", views: "4.1M", tone: "#06b6d4" },
  { id: "v3", title: "The Calvin Cycle, Step by Step", channel: "Prof. Dave Explains", duration: "11:02", views: "1.7M", tone: "#a855f7" },
  { id: "v4", title: "Light Reactions Made Simple", channel: "Bozeman Science", duration: "9:58", views: "980K", tone: "#22d3ee" },
  { id: "v5", title: "Photosynthesis in 5 Minutes", channel: "StudyQuick", duration: "5:12", views: "2.3M", tone: "#8b5cf6" },
  { id: "v6", title: "Chloroplast Structure & Function", channel: "MedBio", duration: "7:33", views: "640K", tone: "#0ea5e9" },
];

// MOCK: pretend to hit a video search service. Phase 2: real YouTube search.
async function mockVideoSearch(query) {
  await wait(900);
  return VIDEO_POOL.map((v) => ({ ...v, title: v.title }));
}

// MOCK: pretend to upload + parse a file. Phase 2: real upload + extraction.
async function mockProcessFile(fileName) {
  await wait(1600);
  return { id: "up_" + Date.now(), kind: "file", name: fileName, meta: "Processed · ready", addedAt: "just now" };
}

// MOCK: pretend to ingest a YouTube URL. Phase 2: real transcript fetch.
async function mockFetchTranscript(url) {
  await wait(1400);
  return { id: "yt_" + Date.now(), kind: "video", name: "Pasted video · ready", meta: "YouTube · transcript ready", addedAt: "just now" };
}

// MOCK generators. Phase 2: replace with real LLM calls over the source.
async function mockGenerateQuiz() { await wait(1500); return mockQuiz; }
async function mockGenerateSummary() { await wait(1300); return mockSummary; }
async function mockGenerateFlashcards() { await wait(1200); return mockFlashcards; }


/* =========================================================================
   2) THEME + MOTION — dark-first, light toggle held in React state.
   (Phase 2 note: persist theme choice; localStorage is unavailable here.)
   ========================================================================= */
const CSS = `
:root{ --r:16px; }
.sf{ --bg:#0a0c13; --bg2:#0f121c; --surface:#141826; --surface2:#1b2032;
  --hover:#222842; --border:rgba(255,255,255,.08); --border2:rgba(255,255,255,.14);
  --text:#e8eaf4; --muted:#969db6; --faint:#636a85;
  --primary:#8b5cf6; --primary2:#a78bfa; --accent:#22d3ee; --accent2:#67e8f9;
  --grad:linear-gradient(120deg,#8b5cf6,#7c73ff 46%,#22d3ee); --glow:rgba(124,92,246,.5);
  --shadow:0 26px 70px -26px rgba(0,0,0,.78); --danger:#f87171; --ok:#34d399;
  color-scheme:dark;
}
.sf.light{ --bg:#f6f7fc; --bg2:#eceffa; --surface:#ffffff; --surface2:#f4f6fd;
  --hover:#eef1fb; --border:rgba(20,25,50,.10); --border2:rgba(20,25,50,.18);
  --text:#161a2b; --muted:#5a6178; --faint:#8b91a8;
  --primary:#7c3aed; --primary2:#6d28d9; --accent:#0891b2; --accent2:#06b6d4;
  --grad:linear-gradient(120deg,#7c3aed,#0891b2); --glow:rgba(124,58,237,.28);
  --shadow:0 24px 60px -28px rgba(30,30,80,.35); color-scheme:light;
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
.sf .fp-track{ will-change:transform; transition:transform 1s cubic-bezier(.16,.84,.28,1); }
.sf .fp-sec{ height:100vh; width:100%; display:grid; place-items:center; position:relative;
  padding:96px 22px 70px; overflow:hidden; }
.sf .fp-inner{ width:100%; max-width:1120px; margin:0 auto; }
/* content rises in only when its section is active */
.sf .fp-sec .rise{ opacity:0; transform:translateY(38px); transition:opacity .85s cubic-bezier(.2,.7,.2,1), transform .85s cubic-bezier(.2,.7,.2,1); }
.sf .fp-sec.on .rise{ opacity:1; transform:none; }
.sf .fp-sec.on .rise.d1{ transition-delay:.06s; }
.sf .fp-sec.on .rise.d2{ transition-delay:.14s; }
.sf .fp-sec.on .rise.d3{ transition-delay:.22s; }
.sf .fp-sec.on .rise.d4{ transition-delay:.30s; }
.sf .fp-sec.on .rise.d5{ transition-delay:.38s; }
.sf .fp-sec.on .rise.d6{ transition-delay:.46s; }

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

@media (max-width:760px){
  .sf .hide-sm{ display:none !important; }
  .sf .wrap{ padding:0 16px; }
  .sf .dots{ right:12px; gap:12px; }
  .sf .fp-sec{ padding:86px 16px 60px; }
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
function Nav({ theme, toggleTheme, onLogo, onOpenLibrary, showApp }) {
  return (
    <div className="nav">
      <div className="wrap row" style={{ height: 66, justifyContent: "space-between" }}>
        <div className="logo" onClick={onLogo}>
          <span className="mark"><GraduationCap size={19} /></span>
          <span>Study<span className="grad-text">Forge</span></span>
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

// Full-page slide controller: each child is one 100vh section; wheel / arrow
// keys / touch-swipe advance one section at a time and the stack slides up.
function FullPage({ pages, labels, theme, toggleTheme }) {
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
    setTimeout(() => { lock.current = false; }, 1050); // matches slide duration
  }, [n]);

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault();
      if (lock.current || Math.abs(e.deltaY) < 12) return;
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
      <div className="lnav">
        <div className="lnav-in">
          <div className="logo" onClick={() => go(0)}>
            <span className="mark"><GraduationCap size={19} /></span>
            <span>Study<span className="grad-text">Forge</span></span>
          </div>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <div className="fp-track" style={{ transform: `translateY(-${idx * 100}vh)` }}>
        {pages.map((P, i) => (
          <section key={i} className={`fp-sec ${i === idx ? "on" : ""}`}>
            <div className="fp-inner">{P}</div>
            {i === 0 && (
              <div className="scrollhint" onClick={() => go(1)}>
                SCROLL <ChevronDown size={18} />
              </div>
            )}
          </section>
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

function Landing({ onStart, theme, toggleTheme }) {
  const hero = (
    <div className="center" style={{ position: "relative" }}>
      <div className="orb" style={{ width: 440, height: 440, background: "var(--primary)", top: -190, left: -90 }} />
      <div className="orb" style={{ width: 360, height: 360, background: "var(--accent)", top: -60, right: -110, animationDelay: "1.5s" }} />
      <div style={{ position: "relative" }}>
        <div className="pill rise d1" style={{ marginBottom: 22 }}>
          <Sparkles size={14} /> Turn anything into a study session
        </div>
        <h1 className="rise d2" style={{ fontSize: "clamp(40px,7.3vw,72px)", lineHeight: 1.02, letterSpacing: "-2px", margin: "0 0 18px", fontWeight: 860 }}>
          Study smarter with<br /><span className="grad-text">StudyForge</span>
        </h1>
        <p className="rise d3" style={{ fontSize: "clamp(16px,2.3vw,20px)", color: "var(--muted)", maxWidth: 580, margin: "0 auto 30px", lineHeight: 1.55 }}>
          Upload notes, drop a YouTube link, or search a topic — then generate quizzes, summaries and flashcards from one place.
        </p>
        <div className="row gap12 rise d4" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={onStart}>Get started <ArrowRight size={18} /></button>
          <button className="btn btn-ghost" onClick={onStart}><Play size={16} /> See how it works</button>
        </div>
        <div className="rise d5" style={{ maxWidth: 640, margin: "40px auto 0" }}>
          <div className="card" style={{ padding: 14, boxShadow: "var(--shadow)" }}>
            <div className="row gap8" style={{ marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: "#f87171" }} />
              <span style={{ width: 10, height: 10, borderRadius: 99, background: "#fbbf24" }} />
              <span style={{ width: 10, height: 10, borderRadius: 99, background: "#34d399" }} />
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[{ i: ListChecks, t: "Quiz", c: "var(--primary)" }, { i: StickyNote, t: "Notes", c: "var(--accent)" }, { i: Layers, t: "Cards", c: "var(--primary2)" }].map((x, k) => (
                <div key={k} className="card" style={{ padding: 14, textAlign: "left", background: "var(--surface2)" }}>
                  <span style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, background: x.c, color: "#fff", marginBottom: 9 }}>
                    <x.i size={18} />
                  </span>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{x.t}</div>
                  <div className="faint" style={{ fontSize: 11.5, marginTop: 3 }}>Auto-generated</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const how = (
    <div>
      <div className="center rise d1" style={{ marginBottom: 44 }}>
        <div className="pill" style={{ marginBottom: 16 }}><MousePointerClick size={14} /> How it works</div>
        <h2 style={{ fontSize: "clamp(28px,4.6vw,44px)", margin: 0, letterSpacing: "-1px", fontWeight: 840 }}>Four steps, one flow</h2>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
        {STEPS.map((s, i) => (
          <div key={i} className={`card card-h rise d${i + 2}`} style={{ padding: 26 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14, background: "var(--grad)", color: "#fff" }}>
                <s.icon size={22} />
              </span>
              <span style={{ fontSize: 44, fontWeight: 860, color: "var(--border2)", lineHeight: 1 }}>{i + 1}</span>
            </div>
            <div style={{ fontWeight: 760, fontSize: 17, marginBottom: 6 }}>{s.title}</div>
            <div className="muted" style={{ fontSize: 14.5, lineHeight: 1.5 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const feat = (
    <div>
      <div className="center rise d1" style={{ marginBottom: 44 }}>
        <div className="pill" style={{ marginBottom: 16 }}><Sparkles size={14} /> Everything you need</div>
        <h2 style={{ fontSize: "clamp(28px,4.6vw,44px)", margin: 0, letterSpacing: "-1px", fontWeight: 840 }}>One hub, every study tool</h2>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
        {FEATURES.map((f, i) => (
          <div key={i} className={`card card-h rise d${(i % 3) + 2}`} style={{ padding: 24 }}>
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14, background: f.c, color: "#fff", marginBottom: 14 }}>
              <f.icon size={22} />
            </span>
            <div style={{ fontWeight: 760, fontSize: 17, marginBottom: 6 }}>{f.title}</div>
            <div className="muted" style={{ fontSize: 14.5, lineHeight: 1.5 }}>{f.body}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const cta = (
    <div className="rise d1" style={{ width: "100%" }}>
      <div className="card" style={{ padding: "60px 34px", textAlign: "center", position: "relative", overflow: "hidden", background: "var(--grad)" }}>
        <h2 style={{ color: "#fff", fontSize: "clamp(28px,4.4vw,42px)", margin: "0 0 14px", letterSpacing: "-.8px", fontWeight: 850 }}>
          Ready to forge your first study set?
        </h2>
        <p style={{ color: "rgba(255,255,255,.92)", margin: "0 0 28px", fontSize: 18 }}>It takes about ten seconds.</p>
        <button className="btn" style={{ background: "#fff", color: "#0a0b12", fontWeight: 750 }} onClick={onStart}>
          Get started free <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <FullPage
      pages={[hero, how, feat, cta]}
      labels={["Home", "How it works", "Features", "Get started"]}
      theme={theme}
      toggleTheme={toggleTheme}
    />
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
        <div className="bob" style={{ width: 64, height: 64, borderRadius: 18, background: "var(--grad)", display: "grid", placeItems: "center", margin: "4px auto 16px", color: "#fff" }}>
          <GraduationCap size={30} />
        </div>
        <div style={{ fontWeight: 820, fontSize: 22, marginBottom: 8 }}>Welcome to StudyForge</div>
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
function QuizView({ data, onBack }) {
  const [answers, setAnswers] = useState({});   // qid -> choice index / text
  const [submitted, setSubmitted] = useState(false);
  const qs = data.questions;

  const score = qs.reduce((n, q) => {
    if (q.type === "short") return n; // short answer self-graded
    return n + (answers[q.id] === q.answer ? 1 : 0);
  }, 0);
  const gradable = qs.filter((q) => q.type !== "short").length;
  const answeredAll = qs.every((q) => answers[q.id] !== undefined && answers[q.id] !== "");

  return (
    <div className="fade-in">
      <ViewHeader icon={ListChecks} title={data.title} onBack={onBack} />
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
          <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => { setSubmitted(false); setAnswers({}); }}>
            <RotateCw size={16} /> Retake quiz
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryView({ data, onBack }) {
  return (
    <div className="fade-in">
      <ViewHeader icon={StickyNote} title={data.title} onBack={onBack} right={<span className="pill" style={{ fontSize: 12 }}><Clock size={13} /> {data.readingTime}</span>} />
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

function FlashcardsView({ data, onBack }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const cards = data.cards;
  const go = (d) => { setFlipped(false); setTimeout(() => setI((v) => (v + d + cards.length) % cards.length), 120); };
  const markKnown = () => { const n = new Set(known); n.add(cards[i].id); setKnown(n); go(1); };

  return (
    <div className="fade-in">
      <ViewHeader icon={Layers} title={data.title} onBack={onBack} right={<span className="pill" style={{ fontSize: 12 }}>{known.size}/{cards.length} learned</span>} />
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

function ViewHeader({ icon: Icon, title, onBack, right }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div className="row gap12">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ChevronLeft size={16} /> Back</button>
        <div className="row gap8" style={{ fontWeight: 780, fontSize: 18 }}><Icon size={20} style={{ color: "var(--primary)" }} /> {title}</div>
      </div>
      {right}
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

function Workspace({ anchors, onOpenLibrary, libraryPick, clearLibraryPick, onToast }) {
  const [source, setSource] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [view, setView] = useState(null);         // 'quiz' | 'summary' | 'flashcards'
  const [payload, setPayload] = useState(null);

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
      {!view ? (
        <div className="grid" style={{ gap: 24 }}>
          <SourcePanel anchors={anchors} source={source} setSource={setSource} onToast={onToast} />
          <GeneratePanel anchors={anchors} ready={ready} onGenerate={generate} busyKey={busyKey} />
          {!ready && <EmptyOutput />}
        </div>
      ) : view === "quiz" ? <QuizView data={payload} onBack={() => setView(null)} />
        : view === "summary" ? <SummaryView data={payload} onBack={() => setView(null)} />
          : <FlashcardsView data={payload} onBack={() => setView(null)} />}
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
    <div className={`sf ${theme === "light" ? "light" : ""}`}>
      <style>{CSS}</style>

      {page === "landing" ? (
        // Landing owns its own fixed nav (theme toggle) and full-page slider.
        <Landing onStart={enterApp} theme={theme} toggleTheme={toggleTheme} />
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

      {welcome && <Welcome onTour={startTour} onSkip={() => { setWelcome(false); setSeenTour(true); }} />}
      {tourStep !== null && <Tour step={tourStep} setStep={setTourStep} onFinish={finishTour} anchors={anchors} />}

      <LibraryDrawer open={libOpen} onClose={() => setLibOpen(false)}
        onPick={(s) => { setLibPick(s); setLibOpen(false); if (page !== "app") setPage("app"); }} />

      {toast && <div className="toast"><CheckCircle2 size={17} color="var(--ok)" /> {toast}</div>}
    </div>
  );
}
