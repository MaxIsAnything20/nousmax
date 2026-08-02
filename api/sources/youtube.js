// POST /api/sources/youtube  { url }
// Fetches the transcript (keyless via youtube-transcript), creates a ready source.
import { requireUser } from "../_lib/auth.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";

function videoId(url) {
    const m = String(url).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { user, error, status } = await requireUser(req);
    if (error) return res.status(status).json({ error });

  const id = videoId(req.body?.url);
    if (!id) return res.status(400).json({ error: "invalid YouTube url" });

  let transcript = "";
    try {
          const { YoutubeTranscript } = await import("youtube-transcript");
          const parts = await YoutubeTranscript.fetchTranscript(id);
          transcript = parts.map((p) => p.text).join(" ");
    } catch (e) {
          return res.status(422).json({ error: "no transcript available", detail: String(e.message || e) });
    }

  const ins = await supabaseAdmin.from("sources").insert({
        user_id: user.id, kind: "video", name: "YouTube " + id, source_url: req.body.url,
        content_text: transcript, status: "ready", meta: "YouTube transcript ready",
  }).select().single();

  return res.status(200).json(ins.data);
}
