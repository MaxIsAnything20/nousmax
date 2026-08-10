// Turns a block of source text into a study set using Google Gemini (free tier).
// The key is passed in from the server route — it is never exposed to the browser.
// We try several free models in order, so hitting one model's daily quota
// automatically falls through to the next instead of failing.

const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"];
const NL = String.fromCharCode(10);

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

function buildPrompt(src) {
  return [
    "You are NousMax, a study assistant. From the SOURCE below, build a study set:",
    "- title: a short topic title.",
    "- summary: 2-4 clear, accurate sentences capturing the key ideas.",
    "- flashcards: 4-6 active-recall question/answer pairs. Questions test understanding, not trivia.",
    "- quiz: 3-4 multiple-choice questions. Each has EXACTLY 4 options and correct is the 0-based index of the right one. Make the wrong options plausible.",
    "Stay strictly faithful to the SOURCE. If the source is too short or unclear, do your best with what is given.",
    "",
    "SOURCE:",
    '"""',
    src,
    '"""',
  ].join(NL);
}

async function callModel(model, sourceText, apiKey) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
  const body = {
    contents: [{ parts: [{ text: buildPrompt(sourceText) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
      temperature: 0.4,
    },
  };
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function generateStudySet(sourceText, apiKey) {
  let res = null;
  let lastStatus = 0;
  let lastDetail = "";

  for (const model of MODELS) {
    res = await callModel(model, sourceText, apiKey);
    if (res.ok) break;
    lastStatus = res.status;
    lastDetail = await res.text();
    // Fall through to the next model only for rate-limit / quota errors.
    if (res.status !== 429) break;
    res = null;
  }

  if (!res || !res.ok) {
    if (lastStatus === 429) {
      throw new Error(
        "You've hit Google's free Gemini usage limit for now. The free quota resets daily (around midnight US Pacific time) — please try again later. For higher limits you can enable billing on your Google AI Studio key."
      );
    }
    if (lastStatus === 400 || lastStatus === 403) {
      throw new Error(
        "The Gemini API rejected the request (status " + lastStatus + "). Double-check the GEMINI_API_KEY in your environment is valid and enabled."
      );
    }
    throw new Error("Gemini API error " + lastStatus + ": " + lastDetail.slice(0, 200));
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("The model returned no content. Please try again.");

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("Could not parse the model's response. Please try again.");
  }

  parsed.flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
  parsed.quiz = (Array.isArray(parsed.quiz) ? parsed.quiz : []).map((q) => ({
    q: q.q,
    options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
    correct: Number.isInteger(q.correct) ? q.correct : 0,
  }));
  return parsed;
}
