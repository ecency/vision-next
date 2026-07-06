// Built via the constructor because the es5 compile target rejects the
// literal's unicode-property escapes; every supported runtime handles them.
const WORD_TOKEN_PATTERN = "[\\p{L}\\p{N}]+";

function tokenize(text: string): string[] {
  return text.toLowerCase().match(new RegExp(WORD_TOKEN_PATTERN, "gu")) ?? [];
}

function buildFrequencyMap(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  return frequencies;
}

/**
 * Word-frequency overlap between two texts (Sorensen-Dice over word
 * multisets): 2 * sum(min(freqA, freqB)) / (lenA + lenB). Returns a value in
 * [0, 1]; 0 when either side has no word tokens.
 */
export function wordOverlapSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return 0;
  }

  const freqA = buildFrequencyMap(tokensA);
  const freqB = buildFrequencyMap(tokensB);

  let overlap = 0;
  freqA.forEach((count, token) => {
    const other = freqB.get(token);
    if (other) {
      overlap += Math.min(count, other);
    }
  });

  return (2 * overlap) / (tokensA.length + tokensB.length);
}
