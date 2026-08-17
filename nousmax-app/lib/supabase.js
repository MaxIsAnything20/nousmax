// Lazily-created Supabase browser client.
// Reads the public URL + anon key from environment variables. If they are
// not set yet, getSupabase() returns null and the app quietly runs without
// accounts, so the site never breaks before setup is finished.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

let client = null;
export function getSupabase() {
  if (client) return client;
  if (!supabaseConfigured) return null;
  client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return client;
}
