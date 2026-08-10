// Turns a block of source text into a study set using Google Gemini (free tier).
// The key is passed in from the server route — it is never exposed to the browser.

const MODEL = "gemini-2.0-flash";

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "A short topic title (2-5 words)." },
    summary: { type: "string", description: "2-4 clear sentences capturing the key ideas." },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string" } },
        required: ["q", "a"],
      },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: {
          q: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct: { type: "integer", description: "Index (0-3) of the correct option." },
        },
        required: ["q", "options", "correct"],
      },
    },
  },
  required: ["title", "summary", "flashcards", "quiz"],
};

const PROMPT = (src) => `You are NousMax, a study assistant. From the SOURCE below, build a study set:
- title: a short topic title.
- summary: 2-4 clear, accurate sentences capturing the key ideas.
- flashcards: 4-6 active-recall question/answer pairs. Questions test understanding, not trivia.
- quiz: 3-4 multiple-choice questions. Each has EXACTLY 4 options and "correct" is the 0-based index of the right one. Make the wrong options plausible.
Stay strictly faithful to the SOURCE. If the source is too short or unclear, do your best with what's given.

SOURCE:
"""
${src}
"""`;

export async function generateStudySet(sourceText, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: PROMPT(sourceText) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
      temperature: 0.4,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("The model returned no content.");

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not parse the model's response as JSON.");
  }

  // light normalization so the UI can trust the shape
  parsed.flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
  parsed.quiz = (Array.isArray(parsed.quiz) ? parsed.quiz : []).map((q) => ({
    q: q.q,
    options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
    correct: Number.isInteger(q.correct) ? q.correct : 0,
  }));
  return parsed;
}
