import { describe, it, expect } from "vitest";
import {
  isRetryableStatus,
  normalizeQuiz,
  normalizeCards,
  normalizeSummary,
} from "./generate.js";

describe("isRetryableStatus (Gemini fallback chain)", () => {
  it("retries the next model on quota, missing, and overload statuses", () => {
    for (const s of [429, 404, 500, 502, 503]) {
      expect(isRetryableStatus(s)).toBe(true);
    }
  });
  it("stops the chain on hard client errors", () => {
    for (const s of [400, 401, 403]) {
      expect(isRetryableStatus(s)).toBe(false);
    }
  });
});

describe("normalizeQuiz", () => {
  it("keeps only questions with exactly 4 options, defaulting correct/explanation", () => {
    const out = normalizeQuiz([
      { q: "Q1", options: ["a", "b", "c", "d"], correct: 2, explanation: "because" },
      { q: "Q2", options: ["a", "b"] },
      { options: ["a", "b", "c", "d"] },
      { q: "Q3", options: ["a", "b", "c", "d", "e"] },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ q: "Q1", options: ["a", "b", "c", "d"], correct: 2, explanation: "because" });
    expect(out[1].options).toHaveLength(4);
    expect(out[1].correct).toBe(0);
    expect(out[1].explanation).toBe("");
  });
  it("returns an empty array for non-array input", () => {
    expect(normalizeQuiz(null)).toEqual([]);
    expect(normalizeQuiz(undefined)).toEqual([]);
  });
});

describe("normalizeCards", () => {
  it("keeps only cards that have both a question and an answer", () => {
    const out = normalizeCards([
      { q: "front", a: "back" },
      { q: "", a: "x" },
      { q: "y" },
      { q: "ok", a: "ok" },
    ]);
    expect(out).toEqual([{ q: "front", a: "back" }, { q: "ok", a: "ok" }]);
  });
});

describe("normalizeSummary", () => {
  it("splits a bulleted string and strips list markers", () => {
    expect(normalizeSummary("- one\n* two\n• three")).toEqual(["one", "two", "three"]);
  });
  it("passes arrays through, trimmed and without blanks", () => {
    expect(normalizeSummary([" a ", "", "b"])).toEqual(["a", "b"]);
  });
});
