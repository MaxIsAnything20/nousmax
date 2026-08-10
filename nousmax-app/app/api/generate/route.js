import { generateStudySet, generateMoreQuiz, generateMoreFlashcards } from "../../../lib/generate";

// POST { text }                                    -> { title, summary[], flashcards[], quiz[] }
// POST { text, mode:"more-quiz", existing[] }       -> { quiz[] }       (may be empty when exhausted)
// POST { text, mode:"more-flashcards", existing[] } -> { flashcards[] } (may be empty when exhausted)
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
    if (body.mode === "more-quiz") {
      const quiz = await generateMoreQuiz(text.slice(0, 12000), body.existing || [], key);
      return Response.json({ quiz });
    }
    if (body.mode === "more-flashcards") {
      const flashcards = await generateMoreFlashcards(text.slice(0, 12000), body.existing || [], key);
      return Response.json({ flashcards });
    }
    const set = await generateStudySet(text.slice(0, 12000), key);
    return Response.json(set);
  } catch (e) {
    return Response.json({ error: e.message || "Generation failed." }, { status: 500 });
  }
}

export const runtime = "nodejs";
