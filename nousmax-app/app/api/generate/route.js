import { generateStudySet } from "../../../lib/generate";

// POST { text: string }  ->  { title, summary, flashcards[], quiz[] }
export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 20) {
      return Response.json(
        { error: "Please paste at least a sentence or two of notes to study." },
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
    const set = await generateStudySet(text.slice(0, 12000), key);
    return Response.json(set);
  } catch (e) {
    return Response.json({ error: e.message || "Generation failed." }, { status: 500 });
  }
}

export const runtime = "nodejs";
