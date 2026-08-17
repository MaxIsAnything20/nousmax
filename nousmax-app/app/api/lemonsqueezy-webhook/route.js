import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Lemon Squeezy subscription webhook.
// Verifies the HMAC signature, then flips the user's plan in Supabase.
//
// Required env vars:
//   LEMONSQUEEZY_WEBHOOK_SECRET  - signing secret from the LMSQ webhook setup
//   SUPABASE_SERVICE_ROLE_KEY    - service role key (bypasses RLS to update any profile)
//   NEXT_PUBLIC_SUPABASE_URL     - your Supabase project URL (already set)

// Statuses that should keep the user on Pro. "cancelled" stays Pro until the
// period ends, at which point LMSQ sends subscription_expired.
const ACTIVE = ["active", "on_trial", "past_due", "cancelled", "paused"];

function verify(raw, signature, secret) {
  if (!signature || !secret) return false;
  const digest = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!verify(raw, signature, secret)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(raw);
    const event = payload.meta && payload.meta.event_name;
    const custom = (payload.meta && payload.meta.custom_data) || {};
    const attrs = (payload.data && payload.data.attributes) || {};
    const subId = payload.data && payload.data.id;

    // We only care about subscription lifecycle events.
    if (!event || event.indexOf("subscription_") !== 0) {
      return Response.json({ ignored: event || "unknown" });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return Response.json({ error: "Server is missing Supabase service credentials." }, { status: 500 });
    }
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const status = attrs.status || "";
    const isActive = ACTIVE.indexOf(status) !== -1 && event !== "subscription_expired";
    const plan = isActive ? "pro" : "free";

    const update = {
      plan: plan,
      subscription_status: status || (event === "subscription_expired" ? "expired" : null),
      lmsq_subscription_id: subId ? String(subId) : null,
      lmsq_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
      renews_at: attrs.renews_at || attrs.ends_at || null,
    };

    // Prefer the Supabase user id we passed as custom data at checkout; fall
    // back to matching on the billing email.
    const userId = custom.user_id || custom.userId;
    let query = admin.from("profiles").update(update);
    if (userId) query = query.eq("id", userId);
    else if (attrs.user_email) query = query.eq("email", attrs.user_email);
    else return Response.json({ error: "No user identifier on event." }, { status: 400 });

    const { error } = await query;
    if (error) { console.error("webhook db error:", error); return Response.json({ error: "Update failed" }, { status: 500 }); }

    return Response.json({ ok: true, event: event, plan: plan });
  } catch (e) {
    console.error("webhook error:", e);    return Response.json({ error: "Webhook failed." }, { status: 500 });
  }
}

export const runtime = "nodejs";
