"use client";
import { useState, useRef } from "react";
import "../globals.css";

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
  const [tools, setTools] = useState({ summary: true, flashcards: true, quiz: true });

  const toggleTool = (k) => {
    setTools((t) => {
      const n = { ...t, [k]: !t[k] };
      if (!n.summary && !n.flashcards && !n.quiz) return t;
      return n;
    });
  };

  const openYoutube = () => {
    const u = ytUrl.trim();
    if (!u) return;
    const full = u.indexOf("http") === 0 ? u : "https://" + u;
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
    setErr(""); setOut(null); setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setOut(data);
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
        <div className="brand">
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <LogoMark size={30} />
            <span>Nous<span className="grad">Max</span></span>
          </a>
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
          <div className="eyebrow">02 · Choose your tools</div>
          <div className="panel">
            <div className="tools">
              {TOOLS.map((t) => (
                <button key={t.key} className={"tool" + (tools[t.key] ? " on" : "")} onClick={() => toggleTool(t.key)}>
                  <span className="tool-top">
                    <span className="ti"><ToolIcon name={t.key} /></span>
                    <span className={"tick" + (tools[t.key] ? " on" : "")}>{tools[t.key] ? "✓" : ""}</span>
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
                <span className="stat"><b>{out.flashcards.length}</b> flashcards</span>
                <span className="stat"><b>{out.quiz.length}</b> quiz questions</span>
                <span className="stat"><b>~{readMin}</b> min of source</span>
              </div>
            </section>

            {tools.summary && (
              <section className="sec">
                <div className="eyebrow">Summary notes</div>
                <div className="panel">
                  <div className="cap">{out.title}</div>
                  <p className="sumtext">{out.summary}</p>
                </div>
              </section>
            )}

            {tools.flashcards && (
              <section className="sec">
                <div className="eyebrow">Flashcards</div>
                <div className="panel">
                  {out.flashcards.map((f, i) => (
                    <div key={i} className="fc">
                      <div className="q">{f.q}</div>
                      <div className="a">{f.a}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tools.quiz && (
              <section className="sec">
                <div className="eyebrow">Quiz</div>
                <div className="panel">
                  {out.quiz.map((q, i) => (
                    <div key={i} className="qblock">
                      <div className="qq">{q.q}</div>
                      {q.options.map((o, j) => (
                        <div key={j} className={"opt" + (j === q.correct ? " ok" : "")}>{o}</div>
                      ))}
                    </div>
                  ))}
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
