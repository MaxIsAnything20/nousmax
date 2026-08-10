"use client";
import { useState } from "react";
import "../globals.css";

const SAMPLES = {
  Photosynthesis:
    "Photosynthesis is the process by which green plants, algae and some bacteria convert light energy into chemical energy. It takes place in the chloroplasts, where the pigment chlorophyll absorbs sunlight. In the light-dependent reactions, water is split to release oxygen and produce ATP and NADPH. In the Calvin cycle, carbon dioxide is fixed into glucose using that ATP and NADPH.",
  "Newton's Laws":
    "Newton's three laws of motion describe the relationship between a body and the forces acting on it. The first law (inertia) states an object stays at rest or in uniform motion unless acted on by a net force. The second law states that force equals mass times acceleration (F = ma). The third law states that for every action there is an equal and opposite reaction.",
};

function LogoMark({ size = 30 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M22 74 L22 26 L54 74 L54 26" stroke="#0d9488" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 74 L42 26 L58 52 L74 26 L74 74" stroke="#d9a521" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

export default function Page() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [out, setOut] = useState(null);

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
          <LogoMark size={30} />
          <span>Nous<span className="grad">Max</span></span>
        </div>
      </header>

      <div className="wrap">
        <h1 className="display">Turn any notes into a <span className="amber">study set.</span></h1>
        <p className="sub">Paste your notes and NousMax builds a summary, flashcards and a quiz — powered by AI.</p>

        <div className="samples">
          {Object.keys(SAMPLES).map((k) => (
            <button key={k} className="chip" onClick={() => setText(SAMPLES[k])}>{k}</button>
          ))}
        </div>

        <textarea
          placeholder="Paste a paragraph of notes here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row">
          <button className="gen" onClick={run} disabled={loading || text.trim().length < 20}>
            {loading ? "Generating…" : "Generate study set"}
          </button>
          <span className="count">{text.length} characters</span>
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
