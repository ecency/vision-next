import { wordOverlapSimilarity } from "../../utils/text-similarity";

describe("wordOverlapSimilarity", () => {
  it("should return 1 for identical texts", () => {
    const text = "My weekly report about the Hive ecosystem";
    expect(wordOverlapSimilarity(text, text)).toBe(1);
  });

  it("should ignore case and punctuation", () => {
    expect(wordOverlapSimilarity("Hello, World!", "hello world")).toBe(1);
  });

  it("should return 0 for fully disjoint texts", () => {
    expect(wordOverlapSimilarity("alpha beta gamma", "delta epsilon zeta")).toBe(0);
  });

  it("should return 0 when either side has no tokens", () => {
    expect(wordOverlapSimilarity("", "some words here")).toBe(0);
    expect(wordOverlapSimilarity("some words here", "")).toBe(0);
    expect(wordOverlapSimilarity("", "")).toBe(0);
    expect(wordOverlapSimilarity("...!!!", "some words here")).toBe(0);
  });

  it("should score a subset against its superset proportionally", () => {
    expect(wordOverlapSimilarity("hola mundo", "hola mundo feliz dia")).toBeCloseTo(2 / 3);
  });

  it("should count repeated words by their minimum frequency", () => {
    expect(wordOverlapSimilarity("foo foo bar", "foo bar bar")).toBeCloseTo(2 / 3);
  });

  it("should handle unicode text", () => {
    const spanish = "¿Cómo estás? ¡Muy bien, gracias! Nos vemos mañana.";
    expect(wordOverlapSimilarity(spanish, spanish)).toBe(1);
    expect(wordOverlapSimilarity(spanish, "completely unrelated english words")).toBe(0);
  });

  it("should stay above 0.9 for near-identical text with small additions", () => {
    const template = Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ");
    const withSmallAdditions = `${template} plus three more`;
    expect(wordOverlapSimilarity(withSmallAdditions, template)).toBeGreaterThanOrEqual(0.9);
  });

  it("should drop below 0.9 once substantial new content is added", () => {
    const template = Array.from({ length: 20 }, (_, i) => `word${i}`).join(" ");
    const rewritten = `${template} ${Array.from({ length: 20 }, (_, i) => `fresh${i}`).join(" ")}`;
    expect(wordOverlapSimilarity(rewritten, template)).toBeLessThan(0.9);
  });
});
