// Browser Supabase client (safe: uses the public anon key; RLS protects data).
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env isn't set (e.g. the static preview), export null so the app can fall
// back to Phase-1 mock behaviour instead of crashing.
export const supabase = url && anon ? createClient(url, anon) : null;
export const backendReady = !!supabase;
