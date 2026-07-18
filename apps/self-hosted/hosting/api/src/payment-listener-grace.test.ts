import { describe, expect, it, vi } from 'vitest';

// parseAbandonedGraceDays must fail safe: any value that is not a positive integer falls back to
// 7. A zero/negative/NaN grace would make the reclaim cutoff `NOW() - (n * INTERVAL '1 day')`
// land at or after now and sweep EVERY inactive tenant, so the guard prevents mass reclamation
// from a misconfigured ABANDONED_TENANT_GRACE_DAYS. The module auto-start is skipped under Vitest.
vi.mock('@ecency/sdk/hive', () => ({
  callRPC: vi.fn(),
  config: { nodes: [] },
  setNodes: vi.fn(),
}));
vi.mock('./db/client', () => ({ db: { query: vi.fn(), queryOne: vi.fn(), queryAll: vi.fn() } }));

const { parseAbandonedGraceDays } = await import('./payment-listener');

describe('parseAbandonedGraceDays', () => {
  it('accepts a valid positive integer', () => {
    expect(parseAbandonedGraceDays('7')).toBe(7);
    expect(parseAbandonedGraceDays('30')).toBe(30);
    expect(parseAbandonedGraceDays('1')).toBe(1);
  });

  it('falls back to 7 for zero, negative, NaN, empty, or undefined', () => {
    expect(parseAbandonedGraceDays('0')).toBe(7);
    expect(parseAbandonedGraceDays('-1')).toBe(7);
    expect(parseAbandonedGraceDays('-30')).toBe(7);
    expect(parseAbandonedGraceDays('abc')).toBe(7);
    expect(parseAbandonedGraceDays('')).toBe(7);
    expect(parseAbandonedGraceDays(undefined)).toBe(7);
  });

  it('truncates a decimal via parseInt (13.9 -> 13, still positive)', () => {
    expect(parseAbandonedGraceDays('13.9')).toBe(13);
  });
});
