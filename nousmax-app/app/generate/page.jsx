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
        <p className="sub">Upload a PDF or notes file, or paste your text — NousMax builds a summary, flashcards and a quiz.</p>

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

        <details className="ythelp">
          <summary>Studying a YouTube video?</summary>
          <div className="ythelp-body">
            <p>YouTube blocks automatic transcript downloads, so grab it in two quick steps:</p>
            <ol>
              <li>Open the video, click <b>…more</b> under the title, then <b>Show transcript</b>.</li>
              <li>Select the transcript text, copy it, and paste it in the box below.</li>
            </ol>
            <div className="ytrow">
              <input className="yt" placeholder="Paste a YouTube link to open it" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} />
              <button className="ytbtn" onClick={openYoutube} disabled={!ytUrl.trim()}>Open video ↗</button>
            </div>
          </div>
        </details>

        <div className="samples">
          <span className="samples-lbl">Or try a sample:</span>
          {Object.keys(SAMPLES).map((k) => (
            <button key={k} className="chip" onClick={() => { setFileName(""); setText(SAMPLES[k]); }}>{k}</button>
          ))}
        </div>

        <textarea
          placeholder="…or paste a paragraph of notes here"
          value={text}
          onChange={(e) => { setText(e.target.value); if (fileName) setFileName(""); }}
        />
        <div className="row">
          <button className="gen" onClick={run} disabled={loading || reading || text.trim().length < 20}>
            {loading ? "Generating…" : "Generate study set"}
          </button>
          <span className="count">{text.length.toLocaleString()} characters</span>
        </div>

        {err && <div className="err">{err}</div>}

        {loading && (
          <div className="grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card">
                <div className="skel" style={{ width: "40%" }} />
                <div className="skel" /><div className="skel" /><div className="skel" style={{ width: "60%" }} />
              </div>
            ))}
          </div>
        )}

        {out && (
          <div className="grid">
            <div className="card">
              <div className="cap">Summary · {out.title}</div>
              <p className="sumtext">{out.summary}</p>
            </div>
            <div className="card">
              <div className="cap">Flashcards</div>
              {out.flashcards.map((f, i) => (
                <div key={i} className="fc">
                  <div className="q">{f.q}</div>
                  <div className="a">{f.a}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="cap">Quiz</div>
              {out.quiz.map((q, i) => (
                <div key={i}>
                  <div className="qq">{q.q}</div>
                  {q.options.map((o, j) => (
                    <div key={j} className={"opt" + (j === q.correct ? " ok" : "")}>{o}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="foot">NousMax · generated with Google Gemini · your key stays on the server.</div>
      </div>
    </>
  );
}
