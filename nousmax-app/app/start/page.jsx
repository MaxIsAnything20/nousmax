"use client";
import { useState, useEffect } from "react";
import "../globals.css";
import { getSupabase, supabaseConfigured } from "../../lib/supabase";

function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M22 74 L22 26 L54 74 L54 26" stroke="#0d9488" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 74 L42 26 L58 52 L74 26 L74 74" stroke="#d9a521" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.2-9.6 6.2-16z" />
      <path fill="#FBBC05" d="M10.4 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.5 2.1-7.9 2.1-6.3 0-11.7-3.7-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function Start() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { if (sub && sub.subscription) sub.subscription.unsubscribe(); };
  }, []);

  const guest = () => { window.location.href = "/generate"; };
  const google = async () => {
    const sb = getSupabase();
    if (!sb) { window.location.href = "/generate"; return; }
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/generate" } });
  };

  const emailAuth = async () => {
    const sb = getSupabase();
    if (!sb) { setMsg("Accounts aren't set up yet."); return; }
    if (!email.trim() || password.length < 6) { setMsg("Enter your email and a password of at least 6 characters."); return; }
    setBusy(true); setMsg("");
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password: password, options: { emailRedirectTo: window.location.origin + "/generate" } });
        if (error) { setMsg(error.message); }
        else if (data.session) { window.location.href = "/generate"; }
        else { setMsg("Almost there — check your email to confirm your account, then sign in."); }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: password });
        if (error) { setMsg(error.message); }
        else { window.location.href = "/generate"; }
      }
    } catch (e) {
      setMsg(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="startwrap">
      <div className="startcard">
        <div className="startlogo">
          <LogoMark size={34} />
          <span>Nous<span className="grad">Max</span></span>
        </div>

        <h1 className="display">Let's get studying.</h1>
        <p className="sub" style={{ margin: "0 auto 24px" }}>
          Sign in to save your study sets and track progress — or jump straight in as a guest.
        </p>

        {session ? (
          <div className="startbtns">
            <button className="startbtn primary" onClick={guest}>Continue as {session.user.email}</button>
          </div>
        ) : (
          <div className="startbtns">
            {supabaseConfigured && (
              <button className="startbtn primary" onClick={google}><GoogleG /> {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}</button>
            )}

            {supabaseConfigured && (
              <>
                <div className="startdiv">or use email</div>
                <input className="startinput" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                <input className="startinput" type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                <button className="startbtn primary" onClick={emailAuth} disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
                <button className="startlink" onClick={() => { setMsg(""); setMode(mode === "signup" ? "signin" : "signup"); }}>
                  {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
                </button>
                {msg && <div className="startmsg">{msg}</div>}
              </>
            )}

            <div className="startdiv">or</div>
            <button className="startbtn ghost" onClick={guest}>Continue as a guest</button>
          </div>
        )}

        <p className="startfine">Guests can build study sets but can't save them to a library.</p>
      </div>
    </div>
  );
}
