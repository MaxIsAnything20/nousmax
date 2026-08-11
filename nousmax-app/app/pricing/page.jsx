"use client";
import { useState, useEffect } from "react";
import "../globals.css";
import { getSupabase, supabaseConfigured } from "../../lib/supabase";
import { FREE_DAILY_GENERATIONS, FREE_SAVED_SETS, PRICE } from "../../lib/plan";

function LogoMark({ size = 30 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M22 74 L22 26 L54 74 L54 26" stroke="#0d9488" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 74 L42 26 L58 52 L74 26 L74 74" stroke="#d9a521" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

const CHECKOUT = {
  monthly: process.env.NEXT_PUBLIC_LMSQ_CHECKOUT_MONTHLY || "",
  yearly: process.env.NEXT_PUBLIC_LMSQ_CHECKOUT_YEARLY || "",
};
const PORTAL_URL = "https://app.lemonsqueezy.com/my-orders";

function buildCheckout(base, session) {
  if (!base) return "";
  if (!session) return base;
  const join = base.indexOf("?") === -1 ? "?" : "&";
  const email = encodeURIComponent(session.user.email || "");
  const uid = encodeURIComponent(session.user.id);
  return base + join + "checkout[email]=" + email + "&checkout[custom][user_id]=" + uid;
}

export default function Pricing() {
  const [session, setSession] = useState(null);
  const [plan, setPlan] = useState("free");
  const [cycle, setCycle] = useState("yearly");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const { data: p } = await sb.from("profiles").select("plan").eq("id", data.session.user.id).maybeSingle();
        if (p && p.plan) setPlan(p.plan);
      }
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { if (sub && sub.subscription) sub.subscription.unsubscribe(); };
  }, []);

  const isPro = plan === "pro";
  const price = PRICE[cycle];
  const base = CHECKOUT[cycle];
  const href = buildCheckout(base, session);
  const configured = Boolean(base);

  const startCheckout = () => {
    if (!session) { window.location.href = "/start"; return; }
    if (!href) return;
    window.location.href = href;
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
            <a className="authlink" href="/generate">Study set generator</a>
            {session && <a className="authlink" href="/profile">My profile</a>}
          </div>
        </div>
      </header>

      <div className="wrap">
        <h1 className="display" style={{ textAlign: "center" }}>Simple pricing.</h1>
        <p className="sub" style={{ textAlign: "center", margin: "0 auto 22px" }}>
          Start free. Upgrade to Pro when you want unlimited study sets.
        </p>

        <div className="cycletoggle">
          <button className={"cyclebtn" + (cycle === "monthly" ? " on" : "")} onClick={() => setCycle("monthly")}>Monthly</button>
          <button className={"cyclebtn" + (cycle === "yearly" ? " on" : "")} onClick={() => setCycle("yearly")}>Yearly · save 33%</button>
        </div>

        <div className="pricegrid">
          <div className="pricecard">
            <div className="priceplan">Free</div>
            <div className="priceamt">$0<span className="priceper">/forever</span></div>
            <ul className="pricelist">
              <li>{FREE_DAILY_GENERATIONS} study sets per day</li>
              <li>Save up to {FREE_SAVED_SETS} sets in your library</li>
              <li>Summaries, quizzes &amp; flashcards</li>
              <li>PDF, YouTube &amp; pasted notes</li>
              <li>Streaks, stats &amp; leaderboard</li>
            </ul>
            <a className="pricebtn ghost" href="/generate">{isPro ? "Use the generator" : "You're on Free"}</a>
          </div>

          <div className="pricecard pro">
            <div className="pricebadge">Most popular</div>
            <div className="priceplan">Pro</div>
            <div className="priceamt">{price.amount}<span className="priceper">{price.period}</span></div>
            <div className="pricenote">{price.note}</div>
            <ul className="pricelist">
              <li><b>Unlimited</b> study sets — no daily cap</li>
              <li><b>Unlimited</b> saved library</li>
              <li><b>Infinite flashcards</b> — keep generating more</li>
              <li>Everything in Free</li>
              <li>Priority new features</li>
            </ul>
            {isPro ? (
              <a className="pricebtn primary" href={PORTAL_URL} target="_blank" rel="noopener">Manage subscription</a>
            ) : configured ? (
              <button className="pricebtn primary" onClick={startCheckout}>
                {session ? "Upgrade to Pro" : "Sign in to upgrade"}
              </button>
            ) : (
              <button className="pricebtn primary" disabled>Checkout coming soon</button>
            )}
          </div>
        </div>

        {!configured && (
          <p className="sub" style={{ textAlign: "center", fontSize: 13, marginTop: 18 }}>
            Checkout isn't wired up yet — add your Lemon Squeezy links to finish setup.
          </p>
        )}
        {isPro && (
          <p className="sub" style={{ textAlign: "center", fontSize: 14, marginTop: 18 }}>
            You're on <b>Pro</b> 🎉 Thanks for supporting NousMax.
          </p>
        )}

        <div className="foot">NousMax · cancel anytime · secure checkout by Lemon Squeezy.</div>
      </div>
    </>
  );
}
