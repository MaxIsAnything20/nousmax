// Frontend data layer - real implementations behind the Phase-1 mock seams.
// StudyForge.jsx delegates to these (via globalThis.SF_API) when backendReady.
import { supabase, backendReady } from "./supabaseClient.js";

async function authedFetch(path, options = {}) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const res = await fetch(path, {
          ...options,
          headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: "Bearer " + token } : {}),
                  ...(options.headers || {}),
          },
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
    return res.json();
}

export const auth = {
    ready: backendReady,
    signUp: (email, password, name) =>
          supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    google: () => supabase.auth.signInWithOAuth({ provider: "google" }),
    signOut: () => supabase.auth.signOut(),
    session: () => supabase.auth.getSession(),
};

export async function processFile(file) {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user.id;
    const path = uid + "/" + Date.now() + "-" + file.name;
    const up = await supabase.storage.from("sources").upload(path, file);
    if (up.error) throw up.error;
    const { data: src } = await supabase.from("sources")
      .insert({ user_id: uid, kind: "file", name: file.name, storage_path: path, status: "processing" })
      .select().single();
    await authedFetch("/api/sources/parse", { method: "POST", body: JSON.stringify({ sourceId: src.id, storagePath: path }) });
    return { ...src, status: "ready" };
}

export const fetchTranscript = (url) =>
    authedFetch("/api/sources/youtube", { method: "POST", body: JSON.stringify({ url }) });

export const videoSearch = (q) => authedFetch("/api/videos/search?q=" + encodeURIComponent(q));

export async function listSources() {
    const { data } = await supabase.from("sources").select("*").order("created_at", { ascending: false });
    return data || [];
}

const generate = (sourceId, type) =>
    authedFetch("/api/generate", { method: "POST", body: JSON.stringify({ sourceId, type }) });

export const generateQuiz       = (sourceId) => generate(sourceId, "quiz");
export const generateSummary    = (sourceId) => generate(sourceId, "summary");
export const generateFlashcards = (sourceId) => generate(sourceId, "flashcards");
