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
              <button className="startbtn primary" onClick={google}><GoogleG /> Sign in with Google</button>
            )}
            {supabaseConfigured && (
              <button className="startbtn" onClick={google}><GoogleG /> Sign up with Google</button>
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
