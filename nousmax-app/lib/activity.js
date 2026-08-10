// Records lightweight study activity events so the profile page can show
// streaks, an activity calendar, and lifetime stats. Fire-and-forget: it
// never throws into the UI and silently no-ops for signed-out (guest) users.
import { getSupabase } from "./supabase";

export async function logEvent(kind) {
  try {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    const session = data && data.session;
    if (!session) return;
    await sb.from("study_events").insert({ user_id: session.user.id, kind: kind });
  } catch (e) {
    // Activity logging is best-effort; never disrupt studying.
  }
}
