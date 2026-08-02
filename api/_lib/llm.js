// LLM provider abstraction. Default: Groq (free, OpenAI-compatible, fast Llama).
// Swap LLM_BASE_URL / LLM_MODEL / the key env to use another OpenAI-compatible
// endpoint (Gemini/OpenAI) - the rest of the app does not change.
const BASE  = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const MODEL = process.env.LLM_MODEL    || "llama-3.3-70b-versatile";
const KEY   = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;

export async function generateJSON({ system, user, maxTokens = 2000 }) {
    if (!KEY) throw new Error("LLM key not configured (GROQ_API_KEY).");
    const res = await fetch(`${BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
          body: JSON.stringify({
                  model: MODEL,
                  temperature: 0.3,
                  max_tokens: maxTokens,
                  response_format: { type: "json_object" },
                  messages: [
                    { role: "system", content: system },
                    { role: "user", content: user },
                          ],
          }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    try { return JSON.parse(text); }
    catch {
          const m = text.match(/\{[\s\S]*\}/);
          if (m) return JSON.parse(m[0]);
          throw new Error("LLM did not return valid JSON.");
    }
}

export function clip(text, chars = 12000) {
    if (!text) return "";
    return text.length > chars ? text.slice(0, chars) + " [truncated]" : text;
}
