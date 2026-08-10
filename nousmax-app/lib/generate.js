// Turns source text into a study set using Google Gemini (free tier).
// The key is passed in from the server route — it is never exposed to the browser.
// We try several free models in order, so hitting one model's daily quota
// automatically falls through to the next instead of failing.

const MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-flash-lite-latest"];
const NL = String.fromCharCode(10);

const QUIZ_ITEM = {
  type: "object",
  properties: {
    q: { type: "string" },
    options: { type: "array", items: { type: "string" } },
    correct: { type: "integer", description: "Index (0-3) of the correct option." },
    explanation: { type: "string", description: "One sentence on why the correct option is right." },
  },
  required: ["q", "options", "correct", "explanation"],
};

const FLASHCARD_ITEM = {
  type: "object",
  properties: { q: { type: "string" }, a: { type: "string" } },
  required: ["q", "a"],
};

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "A short topic title (2-5 words)." },
    summary: {
      type: "array",
      items: { type: "string" },
      description: "Comprehensive study notes as bullet points. Cover essentially everything in the source: every key idea, definition, fact, name, date, formula, cause/effect and relationship. Each item is one clear, self-contained bullet. Use as many bullets as the material needs — do not artificially shorten.",
    },
    flashcards: { type: "array", items: FLASHCARD_ITEM },
    quiz: { type: "array", items: QUIZ_ITEM },
  },
  required: ["title", "summary", "flashcards", "quiz"],
};

const QUIZ_SCHEMA = {
  type: "object",
  properties: { quiz: { type: "array", items: QUIZ_ITEM } },
  required: ["quiz"],
};

const FLASHCARDS_SCHEMA = {
  type: "object",
  properties: { flashcards: { type: "array", items: FLASHCARD_ITEM } },
  required: ["flashcards"],
};

function buildPrompt(src) {
  return [
    "You are NousMax, a study assistant. From the SOURCE below, build a study set:",
    "- title: a short topic title.",
    "- summary: comprehensive study notes as an array of bullet points. Cover essentially EVERYTHING in the source — every key idea, definition, fact, name, date, formula, cause/effect and relationship — so a student could revise from the bullets alone. Each bullet is one clear, self-contained point. Use as many bullets as the material needs (there is no upper limit); do not artificially shorten or drop details.",
    "- flashcards: 6 active-recall question/answer pairs. Questions test understanding, not trivia.",
    "- quiz: 3-4 multiple-choice questions. Each has EXACTLY 4 options, correct is the 0-based index of the right one, and explanation is one sentence on why that option is right. Make the wrong options plausible.",
    "Stay strictly faithful to the SOURCE. If the source is too short or unclear, do your best with what is given.",
    "",
    "SOURCE:",
    '"""',
    src,
    '"""',
  ].join(NL);
}

function buildMoreFlashcardsPrompt(src, existing) {
  const lines = [
    "You are NousMax, a study assistant. Write NEW active-recall flashcards (question/answer pairs) based ONLY on the SOURCE below.",
    "- Questions test understanding, not trivia. Keep answers concise and accurate.",
    "- Produce up to 6 cards.",
    "Do NOT repeat or closely paraphrase any of these already-made questions:",
  ];
  const ex = Array.isArray(existing) ? existing.slice(0, 80) : [];
  for (const qq of ex) lines.push("- " + String(qq));
  lines.push("If the SOURCE genuinely has no more distinct, fair cards left, return an empty flashcards array.");
  lines.push("");
  lines.push("SOURCE:");
  lines.push('"""');
  lines.push(src);
  lines.push('"""');
  return lines.join(NL);
}

function buildMoreQuizPrompt(src, existing) {
  const lines = [
    "You are NousMax, a study assistant. Write NEW multiple-choice quiz questions based ONLY on the SOURCE below.",
    "- Each question has EXACTLY 4 options, correct is the 0-based index of the right one, and explanation is one sentence on why that option is right.",
    "- Make the wrong options plausible. Test understanding, not trivia.",
    "- Produce up to 4 questions.",
    "Do NOT repeat or closely paraphrase any of these already-asked questions:",
  ];
  const ex = Array.isArray(existing) ? existing.slice(0, 60) : [];
  for (const q of ex) lines.push("- " + String(q));
  lines.push("If the SOURCE genuinely has no more distinct, fair questions left, return an empty quiz array.");
  lines.push("");
  lines.push("SOURCE:");
  lines.push('"""');
  lines.push(src);
  lines.push('"""');
  return lines.join(NL);
}

async function callModel(model, prompt, schema, apiKey) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.6,
    },
  };
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function runModels(prompt, schema, apiKey) {
  let lastStatus = 0;
  let lastDetail = "";
  let sawQuota = false;
  for (const model of MODELS) {
    const r = await callModel(model, prompt, schema, apiKey);
    if (r.ok) return r;
    lastStatus = r.status;
    lastDetail = await r.text();
    if (r.status === 429) sawQuota = true;
    if (r.status !== 429 && r.status !== 404) break;
  }
  if (sawQuota) {
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

function readText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

function normalizeQuiz(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((q) => ({
      q: q.q,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      correct: Number.isInteger(q.correct) ? q.correct : 0,
      explanation: typeof q.explanation === "string" ? q.explanation : "",
    }))
    .filter((q) => q.q && q.options.length === 4);
}

function normalizeCards(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((c) => ({ q: typeof c.q === "string" ? c.q : "", a: typeof c.a === "string" ? c.a : "" }))
    .filter((c) => c.q && c.a);
}

function stripBullet(line) {
  let t = line.trim();
  const marks = ["-", "*", "+", "•", "·"];
  while (t.length && marks.indexOf(t.charAt(0)) >= 0) t = t.slice(1).trim();
  return t;
}

function normalizeSummary(s) {
  if (Array.isArray(s)) return s.map((x) => String(x).trim()).filter(Boolean);
  if (typeof s === "string" && s.trim()) {
    return s.split(NL).map(stripBullet).filter(Boolean);
  }
  return [];
}

export async function generateStudySet(sourceText, apiKey) {
  const res = await runModels(buildPrompt(sourceText), SCHEMA, apiKey);
  const data = await res.json();
  const text = readText(data);
  if (!text) throw new Error("The model returned no content. Please try again.");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("Could not parse the model's response. Please try again.");
  }
  parsed.summary = normalizeSummary(parsed.summary);
  parsed.flashcards = normalizeCards(parsed.flashcards);
  parsed.quiz = normalizeQuiz(parsed.quiz);
  return parsed;
}

export async function generateMoreQuiz(sourceText, existing, apiKey) {
  const res = await runModels(buildMoreQuizPrompt(sourceText, existing), QUIZ_SCHEMA, apiKey);
  const data = await res.json();
  const text = readText(data);
  if (!text) return [];
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return [];
  }
  return normalizeQuiz(parsed.quiz);
}

export async function generateMoreFlashcards(sourceText, existing, apiKey) {
  const res = await runModels(buildMoreFlashcardsPrompt(sourceText, existing), FLASHCARDS_SCHEMA, apiKey);
  const data = await res.json();
  const text = readText(data);
  if (!text) return [];
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return [];
  }
  return normalizeCards(parsed.flashcards);
}
