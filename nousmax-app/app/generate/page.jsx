"use client";
import { useState, useRef, useEffect } from "react";
import "../globals.css";
import { getSupabase, supabaseConfigured } from "../../lib/supabase";

const SAMPLES = {
  Photosynthesis:
    "Photosynthesis is the process by which green plants, algae and some bacteria convert light energy into chemical energy. It takes place in the chloroplasts, where the pigment chlorophyll absorbs sunlight. In the light-dependent reactions, water is split to release oxygen and produce ATP and NADPH. In the Calvin cycle, carbon dioxide is fixed into glucose using that ATP and NADPH.",
  "Newton's Laws":
    "Newton's three laws of motion describe the relationship between a body and the forces acting on it. The first law (inertia) states an object stays at rest or in uniform motion unless acted on by a net force. The second law states that force equals mass times acceleration (F = ma). The third law states that for every action there is an equal and opposite reaction.",
};

const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs";
const PDFWORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs";

function LogoMark({ size = 30 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M22 74 L22 26 L54 74 L54 26" stroke="#0d9488" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 74 L42 26 L58 52 L74 26 L74 74" stroke="#d9a521" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function ToolIcon({ name }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "summary")
    return (<svg {...p}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M10 12h6" /><path d="M10 16h6" /></svg>);
  if (name === "flashcards")
    return (<svg {...p}><rect x="3" y="7" width="13" height="11" rx="2" /><path d="M8 4h11a2 2 0 0 1 2 2v9" /></svg>);
  return (<svg {...p}><path d="M4 6h9" /><path d="M4 12h9" /><path d="M4 18h9" /><path d="M17 6l1.6 1.6L22 4" /></svg>);
}

async function extractPdf(file) {
  const pdfjs = await import(/* webpackIgnore: true */ PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFWORKER_URL;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const NL = String.fromCharCode(10);
  let out = "";
  const max = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str).join(" ") + NL + NL;
  }
  return out.trim();
}

const TOOLS = [
  { key: "summary", label: "Summary notes", desc: "Clean, structured notes you'd actually study from." },
  { key: "flashcards", label: "Flashcards", desc: "Flip-card deck for fast active recall." },
  { key: "quiz", label: "Quiz", desc: "Multiple-choice questions to test yourself." },
];

function QuizPlayer({ quiz, sourceText }) {
  const [list, setList] = useState(quiz);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState(() => quiz.map(() => null));
  const [loadingMore, setLoadingMore] = useState(false);
  const [ended, setEnded] = useState(false);
  const [moreErr, setMoreErr] = useState("");

  if (!list.length) return <div className="quiz-end">No quiz questions were generated — try regenerating.</div>;

  const q = list[i];
  const chosen = answers[i];
  const answered = chosen !== null && chosen !== undefined;
  const isRight = answered && chosen === q.correct;
  const answeredCount = answers.filter((a) => a !== null && a !== undefined).length;
  const correctCount = answers.filter((a, k) => a !== null && a !== undefined && a === list[k].correct).length;
  const atLast = i === list.length - 1;

  const pick = (o) => {
    if (answered) return;
    setAnswers((arr) => { const n = arr.slice(); n[i] = o; return n; });
  };

  const loadMore = async () => {
    setMoreErr(""); setLoadingMore(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "more-quiz", text: sourceText, existing: list.map((x) => x.q) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load more questions.");
      const more = Array.isArray(data.quiz) ? data.quiz.filter((x) => x && x.q && Array.isArray(x.options) && x.options.length === 4) : [];
      if (more.length === 0) { setEnded(true); }
      else {
        setList((L) => L.concat(more));
        setAnswers((A) => A.concat(more.map(() => null)));
        setI((idx) => idx + 1);
      }
    } catch (e) {
      setMoreErr(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const next = () => { if (i < list.length - 1) setI(i + 1); else loadMore(); };
  const back = () => { if (i > 0) setI(i - 1); };

  return (
    <div className="quiz">
      <div className="quiz-head">
        <span className="quiz-prog">Question {i + 1} of {list.length}</span>
        <span className="quiz-score">Score {correctCount}/{answeredCount}</span>
      </div>
      <div className="quiz-q">{q.q}</div>
      <div className="quiz-opts">
        {q.options.map((o, j) => {
          let cls = "qopt";
          if (answered) {
            if (j === q.correct) cls += " correct";
            else if (j === chosen) cls += " wrong";
            else cls += " dim";
          }
          const mark = answered && j === q.correct ? "✓" : answered && j === chosen ? "✗" : String.fromCharCode(65 + j);
          return (
            <button key={j} className={cls} onClick={() => pick(j)} disabled={answered}>
              <span className="qopt-mark">{mark}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={"quiz-explain" + (isRight ? " ok" : " no")}>
          <b>{isRight ? "Correct! " : "Not quite. "}</b>
          {q.explanation || (isRight ? "Nicely done." : "The highlighted option is the right answer.")}
        </div>
      )}

      {moreErr && <div className="err" style={{ marginTop: 12 }}>{moreErr}</div>}

      {ended && atLast && (
        <div className="quiz-end">
          You've reached the end of the questions from these notes. You answered {correctCount} of {answeredCount} correctly.
        </div>
      )}

      <div className="quiz-nav">
        <button className="qnav" onClick={back} disabled={i === 0}>← Back</button>
        {atLast && ended ? (
          <button className="qnav primary" onClick={() => setI(0)}>Review from start</button>
        ) : (
          <button className="qnav primary" onClick={next} disabled={!answered || loadingMore}>
            {loadingMore ? "Generating…" : atLast ? "More questions →" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}

function FlashcardDeck({ cards, sourceText }) {
  const [list, setList] = useState(cards);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ended, setEnded] = useState(false);
  const [moreErr, setMoreErr] = useState("");

  if (!list.length) return <div className="quiz-end">No flashcards were generated — try regenerating.</div>;

  const c = list[i];
  const atLast = i === list.length - 1;

  const loadMore = async () => {
    setMoreErr(""); setLoadingMore(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "more-flashcards", text: sourceText, existing: list.map((x) => x.q) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load more cards.");
      const more = Array.isArray(data.flashcards) ? data.flashcards.filter((x) => x && x.q && x.a) : [];
      if (more.length === 0) { setEnded(true); }
      else {
        setList((L) => L.concat(more));
        setFlipped(false);
        setI((idx) => idx + 1);
      }
    } catch (e) {
      setMoreErr(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const prev = () => { if (i > 0) { setFlipped(false); setI(i - 1); } };
  const next = () => {
    if (i < list.length - 1) { setFlipped(false); setI(i + 1); }
    else if (!ended) loadMore();
  };

  return (
    <div>
      <div className="deck-head">
        <span className="quiz-prog">Card {i + 1} of {list.length}</span>
        <span className="quiz-prog">Tap the card to flip</span>
      </div>
      <div className={"flashcard" + (flipped ? " flipped" : "")} onClick={() => setFlipped((f) => !f)}>
        <div className="flashcard-inner">
          <div className="flashcard-face front">
            <span className="flashcard-label">Question</span>
            <div className="flashcard-text">{c.q}</div>
          </div>
          <div className="flashcard-face back">
            <span className="flashcard-label">Answer</span>
            <div className="flashcard-text">{c.a}</div>
          </div>
        </div>
      </div>

      {moreErr && <div className="err" style={{ marginTop: 12 }}>{moreErr}</div>}
      {ended && atLast && (
        <div className="quiz-end">You've reached the end of the cards from these notes — {list.length} in total. Use Prev to review them again.</div>
      )}

      <div className="quiz-nav">
        <button className="qnav" onClick={prev} disabled={i === 0}>← Prev</button>
        <button className="qnav primary" onClick={next} disabled={loadingMore || (atLast && ended)}>
          {loadingMore ? "Generating…" : atLast ? "More cards →" : "Next →"}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [out, setOut] = useState(null);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const [ytUrl, setYtUrl] = useState("");
  const [src, setSrc] = useState("pdf");
  const [tool, setTool] = useState("summary");
  const [srcUsed, setSrcUsed] = useState("");
  const [genId, setGenId] = useState(0);
  const [session, setSession] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { if (sub && sub.subscription) sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async () => {
    const sb = getSupabase();
    if (!sb) { setSaveMsg("Sign-in isn't set up yet."); return; }
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/generate" } });
  };
  const signOut = async () => { const sb = getSupabase(); if (sb) await sb.auth.signOut(); };

  const saveSet = async () => {
    const sb = getSupabase();
    if (!sb) { setSaveMsg("Saving isn't set up yet."); return; }
    if (!session) { signIn(); return; }
    setSaveMsg("Saving…");
    const summaryText = Array.isArray(out.summary) ? out.summary.join(String.fromCharCode(10)) : out.summary;
    const { error } = await sb.from("study_sets").insert({
      user_id: session.user.id,
      title: out.title,
      tool: tool,
      summary: summaryText,
      flashcards: out.flashcards,
      quiz: out.quiz,
      source: srcUsed,
    });
    setSaveMsg(error ? ("Couldn't save: " + error.message) : "Saved to your library ✓");
  };

  const openYoutube = () => {
    let u = ytUrl.trim();
    if (!u) return;
    const low = u.toLowerCase();
    let idx = -1;
    for (const h of ["youtube.com", "youtu.be"]) {
      const p = low.indexOf(h);
      if (p >= 0 && (idx < 0 || p < idx)) idx = p;
    }
    let full = u;
    if (idx > 0) {
      let start = idx;
      if (low.slice(idx - 4, idx) === "www.") start = idx - 4;
      full = u.slice(start);
    }
    if (full.indexOf("http") !== 0) full = "https://" + full;
    window.open(full, "_blank", "noopener");
  };

  const handleFile = async (file) => {
    if (!file) return;
    setErr(""); setOut(null);
    const name = file.name.toLowerCase();
    const ok = name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".pdf");
    if (!ok) { setErr("Please upload a .pdf, .txt or .md file."); return; }
    setReading(true); setFileName(file.name);
    try {
      let extracted = "";
      if (name.endsWith(".pdf")) extracted = await extractPdf(file);
      else extracted = await file.text();
      extracted = extracted.trim();
      if (extracted.length < 20) throw new Error("Couldn't read enough text from that file. If it's a scanned PDF, paste the text instead.");
      setText(extracted);
    } catch (e) {
      setErr(e.message || "Couldn't read that file.");
      setFileName("");
    } finally {
      setReading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(f);
  };

  const run = async () => {
    setErr(""); setOut(null); setLoading(true); setSrcUsed(text);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setOut(data);
      setGenId((g) => g + 1);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const words = text.trim() ? text.trim().split(" ").filter(Boolean).length : 0;
  const readMin = Math.max(1, Math.round(words / 180));

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
              <LogoMark size={30} />
              <span>Nous<span className="grad">Max</span></span>
            </a>
          </div>
          {supabaseConfigured && (
            <div className="authbox">
              {session ? (
                <>
                  <a className="authlink" href="/library">My library</a>
                  <span className="authuser">{session.user.email}</span>
                  <button className="authbtn" onClick={signOut}>Sign out</button>
                </>
              ) : (
                <button className="authbtn primary" onClick={signIn}>Sign in with Google</button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="wrap">
        <h1 className="display">Turn any notes into a <span className="amber">study set.</span></h1>
        <p className="sub">Add a source, pick your tools, and NousMax builds it — all in one place.</p>

        <section className="sec">
          <div className="eyebrow">01 · Add your source</div>
          <div className="panel">
            <div className="srctabs">
              <button className={"srctab" + (src === "pdf" ? " on" : "")} onClick={() => setSrc("pdf")}>PDF / file</button>
              <button className={"srctab" + (src === "youtube" ? " on" : "")} onClick={() => setSrc("youtube")}>YouTube</button>
              <button className={"srctab" + (src === "paste" ? " on" : "")} onClick={() => setSrc("paste")}>Paste text</button>
            </div>

            {src === "pdf" && (
              <div
                className={"drop" + (drag ? " over" : "")}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current && inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.txt,.md,text/plain"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files && e.target.files[0])}
                />
                {reading ? (
                  <span className="drop-main">Reading {fileName}…</span>
                ) : fileName ? (
                  <span className="drop-main">✓ {fileName} — {text.length.toLocaleString()} characters loaded</span>
                ) : (
                  <>
                    <span className="drop-main">Drop a PDF, .txt or .md here, or click to browse</span>
                    <span className="drop-sub">Up to 40 pages · your file is read in your browser</span>
                  </>
                )}
              </div>
            )}

            {src === "youtube" && (
              <div className="srchelp">
                <p>YouTube blocks automatic transcript downloads, so grab it in two quick steps:</p>
                <ol>
                  <li>Open the video, click <b>…more</b> under the title, then <b>Show transcript</b>.</li>
                  <li>Select the transcript text and copy it, then paste it below.</li>
                </ol>
                <div className="ytrow">
                  <input className="yt" placeholder="Paste a YouTube link to open it" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} />
                  <button className="ytbtn" onClick={openYoutube} disabled={!ytUrl.trim()}>Open video ↗</button>
                </div>
                <textarea
                  style={{ marginTop: 12 }}
                  placeholder="Paste the transcript here"
                  value={text}
                  onChange={(e) => { setText(e.target.value); if (fileName) setFileName(""); }}
                />
              </div>
            )}

            {src === "paste" && (
              <>
                <div className="samples">
                  <span className="samples-lbl">Try a sample:</span>
                  {Object.keys(SAMPLES).map((k) => (
                    <button key={k} className="chip" onClick={() => { setFileName(""); setText(SAMPLES[k]); }}>{k}</button>
                  ))}
                </div>
                <textarea
                  placeholder="Paste your notes here"
                  value={text}
                  onChange={(e) => { setText(e.target.value); if (fileName) setFileName(""); }}
                />
              </>
            )}

            <div className="hintrow">
              <span className="count">{text.length.toLocaleString()} characters</span>
              {words > 0 && <span className="count">· {words.toLocaleString()} words · ~{readMin} min read</span>}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="eyebrow">02 · Pick a tool</div>
          <div className="panel">
            <div className="tools">
              {TOOLS.map((t) => (
                <button key={t.key} className={"tool" + (tool === t.key ? " on" : "")} onClick={() => setTool(t.key)}>
                  <span className="tool-top">
                    <span className="ti"><ToolIcon name={t.key} /></span>
                    <span className={"tick" + (tool === t.key ? " on" : "")}>{tool === t.key ? "✓" : ""}</span>
                  </span>
                  <span className="tool-label">{t.label}</span>
                  <span className="tool-desc">{t.desc}</span>
                </button>
              ))}
            </div>
            <div className="row">
              <button className="gen" onClick={run} disabled={loading || reading || text.trim().length < 20}>
                {loading ? "Generating…" : "Generate study set"}
              </button>
              <span className="count">{text.trim().length < 20 ? "Add a source above to begin" : "Ready to generate"}</span>
            </div>
            {err && <div className="err">{err}</div>}
          </div>
        </section>

        {loading && (
          <section className="sec">
            <div className="eyebrow">Working…</div>
            <div className="panel">
              <div className="skel" style={{ width: "40%" }} />
              <div className="skel" /><div className="skel" /><div className="skel" style={{ width: "70%" }} />
            </div>
          </section>
        )}

        {out && (
          <>
            <section className="sec">
              <div className="eyebrow">03 · Your study set</div>
              <div className="stats">
                {tool === "summary" && <span className="stat"><b>{Array.isArray(out.summary) ? out.summary.length : 1}</b> summary points</span>}
                {tool === "flashcards" && <span className="stat"><b>{out.flashcards.length}</b> flashcards</span>}
                {tool === "quiz" && <span className="stat"><b>{out.quiz.length}</b> quiz questions</span>}
                <span className="stat"><b>~{readMin}</b> min of source</span>
              </div>
              {supabaseConfigured && (
                <div className="saverow">
                  <button className="savebtn" onClick={saveSet}>{session ? "Save to library" : "Sign in to save"}</button>
                  {saveMsg && <span className="savemsg">{saveMsg}</span>}
                </div>
              )}
            </section>

            {tool === "summary" && (
              <section className="sec">
                <div className="eyebrow">Summary notes</div>
                <div className="panel">
                  <div className="cap">{out.title}</div>
                  {Array.isArray(out.summary) ? (
                    <ul className="sumlist">
                      {out.summary.map((b, k) => <li key={k}>{b}</li>)}
                    </ul>
                  ) : (
                    <p className="sumtext">{out.summary}</p>
                  )}
                </div>
              </section>
            )}

            {tool === "flashcards" && (
              <section className="sec">
                <div className="eyebrow">Flashcards</div>
                <div className="panel">
                  <FlashcardDeck key={genId} cards={out.flashcards} sourceText={srcUsed} />
                </div>
              </section>
            )}

            {tool === "quiz" && (
              <section className="sec">
                <div className="eyebrow">Quiz</div>
                <div className="panel">
                  <QuizPlayer key={genId} quiz={out.quiz} sourceText={srcUsed} />
                </div>
              </section>
            )}
          </>
        )}

        <div className="foot">NousMax · generated with Google Gemini · your key stays on the server.</div>
      </div>
    </>
  );
}
