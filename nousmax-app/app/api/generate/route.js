import { generateStudySet, generateMoreQuiz, generateMoreFlashcards } from "../../../lib/generate";
import { createClient } from "@supabase/supabase-js";
import { FREE_DAILY_GENERATIONS } from "../../../lib/plan";

// POST { text }                                    -> { title, summary[], flashcards[], quiz[] }
// POST { text, mode:"more-quiz", existing[] }       -> { quiz[] }       (may be empty when exhausted)
// POST { text, mode:"more-flashcards", existing[] } -> { flashcards[] } (Pro only)
//
// Signed-in requests send an "Authorization: Bearer <access_token>" header so
// the route can look up the user's plan and enforce free-tier limits.

function bearer(req) {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().indexOf("bearer ") === 0 ? h.slice(7).trim() : "";
}

function startOfUtcDay() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const text = body.text;
    if (!text || text.trim().length < 20) {
      return Response.json(
        { error: "Please add at least a sentence or two of notes to study." },
        { status: 400 }
      );
    }
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return Response.json(
        { error: "Server is missing GEMINI_API_KEY. Add it in your environment." },
        { status: 500 }
      );
    }

    // Identify the signed-in user (if any) for plan gating.
    const token = bearer(req);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let user = null;
    let plan = "free";
    let sb = null;
    if (token && url && anon) {
      sb = createClient(url, anon, {
        global: { headers: { Authorization: "Bearer " + token } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      try {
        const { data } = await sb.auth.getUser(token);
        user = data && data.user;
        if (user) {
          const { data: prof } = await sb.from("profiles").select("plan").eq("id", user.id).maybeSingle();
          if (prof && prof.plan) plan = prof.plan;
        }
      } catch (e) {
        user = null;
      }
    }
    const pro = plan === "pro";

    if (body.mode === "more-quiz") {
      const quiz = await generateMoreQuiz(text.slice(0, 12000), body.existing || [], key);
      return Response.json({ quiz });
    }

    if (body.mode === "more-flashcards") {
      if (!pro) {
        return Response.json(
          { error: "Infinite flashcards are a Pro feature. Upgrade to keep generating more cards.", upgrade: true },
          { status: 402 }
        );
      }
      const flashcards = await generateMoreFlashcards(text.slice(0, 12000), body.existing || [], key);
      return Response.json({ flashcards });
    }

    // Main generation — enforce the daily cap for signed-in free users.
    if (user && !pro && sb) {
      const { count } = await sb
        .from("study_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("kind", "generate")
        .gte("created_at", startOfUtcDay());
      if (typeof count === "number" && count >= FREE_DAILY_GENERATIONS) {
        return Response.json(
          {
            error: "You've reached today's free limit of " + FREE_DAILY_GENERATIONS + " study sets. Upgrade to Pro for unlimited generations.",
            limit: true,
          },
          { status: 429 }
        );
      }
    }

    const set = await generateStudySet(text.slice(0, 12000), key);

    // Authoritative activity log for signed-in users. This both powers the
    // daily cap above and feeds streaks/stats on the profile page, so the
    // browser no longer logs "generate" itself.
    if (user && sb) {
      try { await sb.from("study_events").insert({ user_id: user.id, kind: "generate" }); } catch (e) {}
    }

    return Response.json(set);
  } catch (e) {
    console.error("generate error:", e);    return Response.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}

export const runtime = "nodejs";
