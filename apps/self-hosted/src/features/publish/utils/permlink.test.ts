import { describe, it, expect } from 'vitest';
import { createPermlink } from './permlink';

describe('createPermlink', () => {
  it('creates a slug from a normal title', () => {
    const result = createPermlink('Hello World');
    expect(result).toBe('hello-world');
  });

  it('strips diacritics', () => {
    const result = createPermlink('Café résumé');
    expect(result).toBe('cafe-resume');
  });

  it('truncates to 5 words', () => {
    const result = createPermlink('one two three four five six seven');
    expect(result).toBe('one-two-three-four-five');
  });

  it('limits to 255 characters', () => {
    const longTitle = 'a'.repeat(300);
    const result = createPermlink(longTitle);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('returns a random fallback for empty input', () => {
    const result = createPermlink('');
    expect(result.length).toBeGreaterThan(0);
    // Random hex string
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it('returns a random fallback for emoji-only input', () => {
    const result = createPermlink('😀🎉');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it('appends random suffix when random=true', () => {
    const result = createPermlink('Hello World', true);
    expect(result).toMatch(/^hello-world-[a-f0-9]+$/);
  });

  it('handles single word titles', () => {
    const result = createPermlink('blockchain');
    expect(result).toBe('blockchain');
  });

  it('collapses repeated dashes', () => {
    const result = createPermlink('hello---world');
    expect(result).toBe('hello-world');
  });
});
