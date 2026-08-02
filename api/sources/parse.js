// POST /api/sources/parse  { sourceId, storagePath }
// Downloads the uploaded file from Supabase Storage, extracts text
// (PDF / DOCX; images can be OCR'd with tesseract.js), writes it back to the
// source row and marks it ready.
import { requireUser } from "../_lib/auth.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { user, error, status } = await requireUser(req);
    if (error) return res.status(status).json({ error });

  const { sourceId, storagePath } = req.body || {};
    if (!sourceId || !storagePath) return res.status(400).json({ error: "missing fields" });

  const dl = await supabaseAdmin.storage.from("sources").download(storagePath);
    if (dl.error || !dl.data) return res.status(404).json({ error: "file not found" });

  const name = storagePath.toLowerCase();
    const buf = Buffer.from(await dl.data.arrayBuffer());
    let text = "";
    try {
          if (name.endsWith(".pdf")) {
                  const pdf = (await import("pdf-parse")).default;
                  text = (await pdf(buf)).text;
          } else if (name.endsWith(".docx")) {
                  const mammoth = await import("mammoth");
                  text = (await mammoth.extractRawText({ buffer: buf })).value;
          } else if (name.endsWith(".txt") || name.endsWith(".md")) {
                  text = buf.toString("utf8");
          } else {
                  const T = await import("tesseract.js").catch(() => null);
                  if (T) { text = (await T.recognize(buf, "eng")).data.text; }
                  else return res.status(415).json({ error: "unsupported file type" });
          }
    } catch (e) {
          await supabaseAdmin.from("sources").update({ status: "error" }).eq("id", sourceId).eq("user_id", user.id);
          return res.status(422).json({ error: "could not parse file", detail: String(e.message || e) });
    }

  await supabaseAdmin.from("sources")
      .update({ content_text: text.trim(), status: "ready", meta: Math.round(text.length / 1000) + "k chars ready" })
      .eq("id", sourceId).eq("user_id", user.id);
    return res.status(200).json({ ready: true });
}
