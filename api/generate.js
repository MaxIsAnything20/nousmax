// POST /api/generate  { sourceId, type: 'quiz'|'summary'|'flashcards' }
// Loads the source text, asks the LLM to produce the study tool as JSON,
// stores it in generations, and returns the payload the UI already expects.
import { requireUser } from "./_lib/auth.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { generateJSON, clip } from "./_lib/llm.js";

const PROMPTS = {
    quiz: {
          system: "You are a study-tool generator. Return ONLY JSON matching: " +
                  '{"title":string,"questions":[{"id":string,"type":"mcq"|"tf"|"short","prompt":string,' +
                  '"options":string[]?,"answer":number|string,"explanation":string}]}. ' +
                  "For mcq/tf, answer is the 0-based index into options. Make 4-6 questions.",
          user: (t) => "Create a quiz from this material:\n\n" + t,
    },
    summary: {
          system: "You are a study-tool generator. Return ONLY JSON matching: " +
                  '{"title":string,"readingTime":string,"sections":[{"heading":string,"body":string,"points":string[]}]}. ' +
                  "Make 3-5 clear sections a student could study from.",
          user: (t) => "Summarize this material into structured study notes:\n\n" + t,
    },
    flashcards: {
          system: "You are a study-tool generator. Return ONLY JSON matching: " +
                  '{"title":string,"cards":[{"id":string,"front":string,"back":string}]}. Make 6-12 cards.',
          user: (t) => "Create flashcards from this material:\n\n" + t,
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { user, error, status } = await requireUser(req);
    if (error) return res.status(status).json({ error });

  const { sourceId, type } = req.body || {};
    if (!PROMPTS[type]) return res.status(400).json({ error: "bad type" });

  const { data: source } = await supabaseAdmin
      .from("sources").select("*").eq("id", sourceId).eq("user_id", user.id).single();
    if (!source) return res.status(404).json({ error: "source not found" });
    if (!source.content_text) return res.status(409).json({ error: "source not ready" });

  const p = PROMPTS[type];
    let payload;
    try {
          payload = await generateJSON({ system: p.system, user: p.user(clip(source.content_text)) });
    } catch (e) {
          return res.status(502).json({ error: "generation failed", detail: String(e.message || e) });
    }

  const ins = await supabaseAdmin
      .from("generations")
      .insert({ user_id: user.id, source_id: sourceId, type, payload })
      .select().single();

  await supabaseAdmin.from("study_events").insert({ user_id: user.id, kind: "generated_" + type });
    return res.status(200).json({ id: ins.data?.id, ...payload });
}
