/**
 * Fisher-Yates over a small deterministic generator (mulberry32), so the same
 * seed always yields the same order. Suggestion widgets draw one seed per
 * mount: the picks change on every page load, and stay put while the reader
 * scrolls, the queries refetch and the component re-renders.
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = Math.floor(seed * 0xffffffff) >>> 0;
  const rand = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
