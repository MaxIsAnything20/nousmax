"use client";
import { useState, useEffect } from "react";
import "../globals.css";
import { getSupabase, supabaseConfigured } from "../../lib/supabase";

function LogoMark({ size = 30 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M22 74 L22 26 L54 74 L54 26" stroke="#0d9488" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 74 L42 26 L58 52 L74 26 L74 74" stroke="#d9a521" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

const TOOL_LABEL = { summary: "Summary notes", flashcards: "Flashcards", quiz: "Quiz" };

export default function Library() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setReady(true); setLoading(false); return; }
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { if (sub && sub.subscription) sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !session) { setSets([]); setLoading(false); return; }
    setLoading(true);
    sb.from("study_sets").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) setErr(error.message);
      setSets(data || []);
      setLoading(false);
    });
  }, [session]);

  const signIn = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/library" } });
  };
  const signOut = async () => { const sb = getSupabase(); if (sb) await sb.auth.signOut(); };
  const del = async (id) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("study_sets").delete().eq("id", id);
    setSets((s) => s.filter((x) => x.id !== id));
  };

  const fmt = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    catch (e) { return ""; }
  };

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
          <div className="authbox">
            <a className="authlink" href="/generate">New study set</a>
            {session && <button className="authbtn" onClick={signOut}>Sign out</button>}
          </div>
        </div>
      </header>

      <div className="wrap">
        <h1 className="display">Your <span className="amber">library.</span></h1>
        <p className="sub">Every study set you save lives here, ready to revisit.</p>

        {!supabaseConfigured && (
          <div className="panel">Accounts aren't set up yet. Add your Supabase keys to enable saving.</div>
        )}

        {supabaseConfigured && ready && !session && (
          <div className="panel" style={{ textAlign: "center" }}>
            <p className="sub" style={{ margin: "0 auto 16px" }}>Sign in to see your saved study sets.</p>
            <button className="authbtn primary" onClick={signIn}>Sign in with Google</button>
          </div>
        )}

        {supabaseConfigured && session && (
          <section className="sec">
            {err && <div className="err">{err}</div>}
            {loading ? (
              <div className="panel"><div className="skel" style={{ width: "50%" }} /><div className="skel" /></div>
            ) : sets.length === 0 ? (
              <div className="panel">No saved sets yet. Generate one and hit <b>Save to library</b>.</div>
            ) : (
              sets.map((s) => (
                <div key={s.id} className="libitem">
                  <div className="libhead" onClick={() => setOpenId(openId === s.id ? null : s.id)}>
                    <div>
                      <div className="libtitle">{s.title || "Untitled set"}</div>
                      <div className="libmeta">{TOOL_LABEL[s.tool] || s.tool} · {fmt(s.created_at)}</div>
                    </div>
                    <span className="libchev">{openId === s.id ? "–" : "+"}</span>
                  </div>

                  {openId === s.id && (
                    <div className="libbody">
                      {s.summary && (
                        <div className="libsec">
                          <div className="cap">Summary</div>
                          {(() => {
                            const pts = String(s.summary).split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean);
                            return pts.length > 1 ? (
                              <ul className="sumlist">{pts.map((p, k) => <li key={k}>{p}</li>)}</ul>
                            ) : (
                              <p className="sumtext">{s.summary}</p>
                            );
                          })()}
                        </div>
                      )}
                      {Array.isArray(s.flashcards) && s.flashcards.length > 0 && (
                        <div className="libsec">
                          <div className="cap">Flashcards</div>
                          {s.flashcards.map((f, i) => (
                            <div key={i} className="fc">
                              <div className="q">{f.q}</div>
                              <div className="a">{f.a}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {Array.isArray(s.quiz) && s.quiz.length > 0 && (
                        <div className="libsec">
                          <div className="cap">Quiz</div>
                          {s.quiz.map((q, i) => (
                            <div key={i} className="qblock">
                              <div className="qq">{q.q}</div>
                              {(q.options || []).map((o, j) => (
                                <div key={j} className={"opt" + (j === q.correct ? " ok" : "")}>{o}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      <button className="qnav" style={{ marginTop: 14 }} onClick={() => del(s.id)}>Delete this set</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        <div className="foot">NousMax · your saved sets are private to your account.</div>
      </div>
    </>
  );
}
