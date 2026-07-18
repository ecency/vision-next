import { describe, expect, it } from 'vitest';
import {
  remainingMonths,
  customDomainUpgradeHbd,
  CUSTOM_DOMAIN_UPGRADE_DELTA_HBD,
  MONTHLY_PRICE_HBD,
  CUSTOM_DOMAIN_MONTHLY_PRICE_HBD,
} from './pricing';

const now = new Date('2026-01-15T00:00:00.000Z');

describe('remainingMonths', () => {
  it('is 0 for a null or already-expired term', () => {
    expect(remainingMonths(null, now)).toBe(0);
    expect(remainingMonths(new Date('2026-01-14T00:00:00.000Z'), now)).toBe(0);
  });

  it('counts whole calendar months to expiry', () => {
    // Same day-of-month, 5 months out.
    expect(remainingMonths(new Date('2026-06-15T00:00:00.000Z'), now)).toBe(5);
    // Exactly a year (same day) -> 12, not 13.
    expect(remainingMonths(new Date('2027-01-15T00:00:00.000Z'), now)).toBe(12);
  });

  it('rounds a partial month UP', () => {
    // 5 months + a few days -> 6.
    expect(remainingMonths(new Date('2026-06-20T00:00:00.000Z'), now)).toBe(6);
  });

  it('is at least 1 for any future expiry (min one month of the add-on)', () => {
    expect(remainingMonths(new Date('2026-01-16T00:00:00.000Z'), now)).toBe(1);
  });

  it('handles JS end-of-month rollover as a single month (Jan 31 + 1mo -> Mar 3 = 1)', () => {
    const jan31 = new Date('2026-01-31T00:00:00.000Z');
    // A one-month term bought on Jan 31 lands on Mar 3 (Feb has no 31st). Upgrading immediately
    // must count that as ONE remaining month, not two.
    expect(remainingMonths(new Date('2026-03-03T00:00:00.000Z'), jan31)).toBe(1);
  });
});

describe('customDomainUpgradeHbd', () => {
  it('is remaining months x the +1/mo custom-domain premium', () => {
    // Default delta is the custom-domain monthly minus standard monthly (= 1 HBD).
    expect(CUSTOM_DOMAIN_UPGRADE_DELTA_HBD).toBe(CUSTOM_DOMAIN_MONTHLY_PRICE_HBD - MONTHLY_PRICE_HBD);
    expect(customDomainUpgradeHbd(new Date('2026-06-15T00:00:00.000Z'), now)).toBe(
      5 * CUSTOM_DOMAIN_UPGRADE_DELTA_HBD
    );
  });

  it('is 0 for an expired/null term (no upgrade to charge)', () => {
    expect(customDomainUpgradeHbd(null, now)).toBe(0);
  });
});
