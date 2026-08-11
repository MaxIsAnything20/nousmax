"use client";
import { useState, useEffect, useMemo } from "react";
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
const DAY = 86400000;
const GOALS = [10, 20, 30, 50];

function firstName(session) {
  if (!session) return "";
  const m = session.user.user_metadata || {};
  const n = m.given_name || m.full_name || m.name || session.user.email || "there";
  return String(n).split(" ")[0];
}

function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeStreak(daySet) {
  const today = startOfToday();
  const tKey = dayKey(today);
  const yKey = dayKey(new Date(today.getTime() - DAY));
  let cur = new Date(today);
  if (!daySet.has(tKey)) {
    if (daySet.has(yKey)) cur = new Date(today.getTime() - DAY);
    else return 0;
  }
  let streak = 0;
  while (daySet.has(dayKey(cur))) {
    streak += 1;
    cur = new Date(cur.getTime() - DAY);
  }
  return streak;
}

function computeLongest(daySet) {
  const keys = Array.from(daySet).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    const d = new Date(k + "T00:00:00");
    if (prev && Math.round((d.getTime() - prev.getTime()) / DAY) === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

function buildWeeks(countByDay) {
  const today = startOfToday();
  const weeks = 18;
  const start = new Date(today.getTime() - (weeks * 7 - 1 + today.getDay()) * DAY);
  const cols = [];
  let cursor = new Date(start);
  for (let w = 0; w < weeks + 1; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      if (cursor.getTime() > today.getTime()) { col.push(null); }
      else {
        const key = dayKey(cursor);
        col.push({ key, count: countByDay[key] || 0, date: new Date(cursor) });
      }
      cursor = new Date(cursor.getTime() + DAY);
    }
    cols.push(col);
  }
  return cols;
}

function level(n) {
  if (!n) return 0;
  if (n <= 2) return 1;
  if (n <= 5) return 2;
  if (n <= 9) return 3;
  return 4;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }); }
  catch (e) { return ""; }
}

function LibDeck({ cards }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards.length) return null;
  const c = cards[i];
  const go = (d) => { setFlipped(false); setI((x) => Math.min(cards.length - 1, Math.max(0, x + d))); };
  return (
    <div>
      <div className="deck-head">
        <span className="quiz-prog">Card {i + 1} of {cards.length}</span>
        <span className="quiz-prog">Tap to flip</span>
      </div>
      <div className={"flashcard" + (flipped ? " flipped" : "")} onClick={() => setFlipped((f) => !f)}>
        <div className="flashcard-inner">
          <div className="flashcard-face front"><span className="flashcard-label">Question</span><div className="flashcard-text">{c.q}</div></div>
          <div className="flashcard-face back"><span className="flashcard-label">Answer</span><div className="flashcard-text">{c.a}</div></div>
        </div>
      </div>
      <div className="quiz-nav">
        <button className="qnav" onClick={() => go(-1)} disabled={i === 0}>← Prev</button>
        <button className="qnav primary" onClick={() => go(1)} disabled={i === cards.length - 1}>Next →</button>
      </div>
    </div>
  );
}

export default function Profile() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [sets, setSets] = useState([]);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [board, setBoard] = useState([]);
  const [nameInput, setNameInput] = useState("");
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
    if (!sb || !session) { setSets([]); setEvents([]); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      sb.from("study_sets").select("*").order("created_at", { ascending: false }),
      sb.from("study_events").select("kind, created_at"),
      sb.from("profiles").select("display_name, daily_goal, on_leaderboard").eq("id", session.user.id).maybeSingle(),
      sb.rpc("leaderboard"),
    ]).then((res) => {
      const s = res[0], ev = res[1], pr = res[2], lb = res[3];
      if (s.error) setErr(s.error.message);
      setSets(s.data || []);
      setEvents(ev.data || []);
      const p = pr.data || { display_name: "", daily_goal: 20, on_leaderboard: true };
      setProfile(p);
      setNameInput(p.display_name || "");
      setBoard(lb.data || []);
      setLoading(false);
    });
  }, [session]);

  const stats = useMemo(() => {
    const countByDay = {};
    const daySet = new Set();
    const tKey = dayKey(startOfToday());
    let cards = 0, gen = 0, qCorrect = 0, qWrong = 0, todayCards = 0;
    for (const e of events) {
      const d = new Date(e.created_at);
      const key = dayKey(d);
      countByDay[key] = (countByDay[key] || 0) + 1;
      daySet.add(key);
      if (e.kind === "card") { cards += 1; if (key === tKey) todayCards += 1; }
      else if (e.kind === "generate") gen += 1;
      else if (e.kind === "quiz_correct") qCorrect += 1;
      else if (e.kind === "quiz_wrong") qWrong += 1;
    }
    const quizAnswered = qCorrect + qWrong;
    return {
      countByDay, daySet, cards, gen, qCorrect, quizAnswered, todayCards,
      accuracy: quizAnswered ? Math.round((qCorrect / quizAnswered) * 100) : null,
      streak: computeStreak(daySet),
      longest: computeLongest(daySet),
      setsSaved: sets.length,
      activeDays: daySet.size,
    };
  }, [events, sets]);

  const weeks = useMemo(() => buildWeeks(stats.countByDay), [stats.countByDay]);

  const badges = useMemo(() => {
    const b = (icon, name, desc, done) => ({ icon, name, desc, done });
    return [
      b("🌱", "First steps", "Generate your first study set", stats.gen >= 1),
      b("🔥", "On a roll", "Reach a 3-day streak", stats.streak >= 3 || stats.longest >= 3),
      b("📅", "Week warrior", "Reach a 7-day streak", stats.longest >= 7),
      b("🗂️", "Collector", "Save 5 study sets", stats.setsSaved >= 5),
      b("🃏", "Card shark", "Study 50 flashcards", stats.cards >= 50),
      b("💯", "Centurion", "Study 100 flashcards", stats.cards >= 100),
      b("🧠", "Quiz master", "Answer 50 quiz questions", stats.quizAnswered >= 50),
      b("🎯", "Sharp shooter", "90%+ accuracy over 20 questions", stats.accuracy !== null && stats.accuracy >= 90 && stats.quizAnswered >= 20),
    ];
  }, [stats]);

  const signOut = async () => { const sb = getSupabase(); if (sb) await sb.auth.signOut(); };
  const del = async (id) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("study_sets").delete().eq("id", id);
    setSets((s) => s.filter((x) => x.id !== id));
  };

  const saveProfile = async (patch) => {
    const sb = getSupabase();
    if (!sb || !session) return;
    const base = profile || { display_name: "", daily_goal: 20, on_leaderboard: true };
    const next = Object.assign({}, base, patch);
    setProfile(next);
    await sb.from("profiles").upsert({
      id: session.user.id,
      display_name: next.display_name,
      daily_goal: next.daily_goal,
      on_leaderboard: next.on_leaderboard,
      updated_at: new Date().toISOString(),
    });
    const { data } = await sb.rpc("leaderboard");
    setBoard(data || []);
  };

  const initial = session && session.user.email ? session.user.email.charAt(0).toUpperCase() : "?";
  const unlocked = badges.filter((x) => x.done).length;
  const goal = profile ? profile.daily_goal : 20;
  const goalPct = Math.min(100, Math.round((stats.todayCards / Math.max(1, goal)) * 100));
  const myName = profile ? (profile.display_name || "") : "";

  const monthLabels = weeks.map((col) => {
    const first = col.find((c) => c);
    if (first && first.date.getDate() <= 7) return MONTHS[first.date.getMonth()];
    return "";
  });

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
        {!supabaseConfigured && (
          <div className="panel">Accounts aren't set up yet. Add your Supabase keys to enable profiles.</div>
        )}

        {supabaseConfigured && ready && !session && (
          <div className="panel" style={{ textAlign: "center" }}>
            <h1 className="display" style={{ marginBottom: 8 }}>Your <span className="amber">profile.</span></h1>
            <p className="sub" style={{ margin: "0 auto 16px" }}>Sign in to track your streak, stats, and saved study sets.</p>
            <a className="authbtn primary" href="/start">Sign in</a>
          </div>
        )}

        {supabaseConfigured && session && (
          <>
            <section className="profhead">
              <div className="profavatar">{initial}</div>
              <div className="profid">
                <div className="profname">Hey {firstName(session)} 👋</div>
                <div className="profsince">{session.user.email} · Member since {fmtDate(session.user.created_at)}</div>
              </div>
            </section>

            <section className="streakrow">
              <div className="streakcard">
                <div className="streakflame">🔥</div>
                <div>
                  <div className="streaknum">{stats.streak}</div>
                  <div className="streaklbl">day streak</div>
                </div>
              </div>
              <div className="ministat"><div className="ministat-num">{stats.longest}</div><div className="ministat-lbl">longest streak</div></div>
              <div className="ministat"><div className="ministat-num">{stats.activeDays}</div><div className="ministat-lbl">active days</div></div>
            </section>

            {err && <div className="err">{err}</div>}

            <section className="sec">
              <div className="eyebrow">Daily goal</div>
              <div className="panel">
                <div className="goaltop">
                  <div className="goalcount"><b>{stats.todayCards}</b> / {goal} cards today</div>
                  <div className="goalpick">
                    {GOALS.map((g) => (
                      <button key={g} className={"goalbtn" + (goal === g ? " on" : "")} onClick={() => saveProfile({ daily_goal: g })}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="goalbar"><div className="goalfill" style={{ width: goalPct + "%" }} /></div>
                <div className="goalmsg">{stats.todayCards >= goal ? "Goal reached — nice work! 🎉" : "Study " + (goal - stats.todayCards) + " more cards to hit today's goal."}</div>
              </div>
            </section>

            <section className="sec">
              <div className="eyebrow">Activity</div>
              <div className="panel">
                <div className="heatscroll">
                  <div className="heatmonths">
                    {monthLabels.map((m, k) => (<span key={k} className="heatmonth">{m}</span>))}
                  </div>
                  <div className="heatgrid">
                    {weeks.map((col, wi) => (
                      <div key={wi} className="heatcol">
                        {col.map((cell, di) => (
                          <div
                            key={di}
                            className={"heatcell" + (cell ? (" lvl" + level(cell.count)) : " empty")}
                            title={cell ? (cell.count + " on " + cell.key) : ""}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="heatlegend">
                  <span>Less</span>
                  <span className="heatcell lvl0" /><span className="heatcell lvl1" /><span className="heatcell lvl2" /><span className="heatcell lvl3" /><span className="heatcell lvl4" />
                  <span>More</span>
                </div>
              </div>
            </section>

            <section className="sec">
              <div className="eyebrow">Lifetime stats</div>
              <div className="statgrid">
                <div className="stattile"><div className="stattile-num">{stats.setsSaved}</div><div className="stattile-lbl">Sets saved</div></div>
                <div className="stattile"><div className="stattile-num">{stats.gen}</div><div className="stattile-lbl">Sets generated</div></div>
                <div className="stattile"><div className="stattile-num">{stats.cards}</div><div className="stattile-lbl">Cards studied</div></div>
                <div className="stattile"><div className="stattile-num">{stats.quizAnswered}</div><div className="stattile-lbl">Quiz questions</div></div>
                <div className="stattile"><div className="stattile-num">{stats.accuracy === null ? "—" : stats.accuracy + "%"}</div><div className="stattile-lbl">Quiz accuracy</div></div>
              </div>
            </section>

            <section className="sec">
              <div className="eyebrow">Achievements · {unlocked}/{badges.length}</div>
              <div className="badgegrid">
                {badges.map((bd, k) => (
                  <div key={k} className={"badge" + (bd.done ? " on" : "")}>
                    <div className="badge-icon">{bd.done ? bd.icon : "🔒"}</div>
                    <div className="badge-name">{bd.name}</div>
                    <div className="badge-desc">{bd.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="sec">
              <div className="eyebrow">Leaderboard</div>
              <div className="panel">
                <div className="lbname-row">
                  <input className="yt" placeholder="Your display name" value={nameInput} maxLength={24} onChange={(e) => setNameInput(e.target.value)} />
                  <button className="ytbtn" onClick={() => saveProfile({ display_name: nameInput.trim() })}>{myName ? "Update" : "Join"}</button>
                </div>
                <div className="lbhint">{myName ? "You're on the board as " + myName + ". Study more to climb!" : "Add a display name to appear on the global leaderboard. Only your name and study counts are shown — never your email."}</div>
                {board.length === 0 ? (
                  <div className="lbempty">No one has joined yet — be the first!</div>
                ) : (
                  <div className="lb">
                    <div className="lbrow lbhead"><span className="lbrank">#</span><span className="lbnm">Name</span><span className="lbval">Cards</span><span className="lbval">Sets</span></div>
                    {board.map((r, k) => (
                      <div key={k} className={"lbrow" + (myName && r.name === myName ? " lbme" : "")}>
                        <span className="lbrank">{k + 1}</span>
                        <span className="lbnm">{r.name}</span>
                        <span className="lbval">{r.cards}</span>
                        <span className="lbval">{r.sets}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="sec">
              <div className="eyebrow">Your library</div>
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
                        <div className="libmeta">{TOOL_LABEL[s.tool] || s.tool} · {fmtDate(s.created_at)}</div>
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
                            <LibDeck cards={s.flashcards} />
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
          </>
        )}

        <div className="foot">NousMax · your profile and saved sets are private to your account.</div>
      </div>
    </>
  );
}
