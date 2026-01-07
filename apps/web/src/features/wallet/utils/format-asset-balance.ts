const DEFAULT_FRACTION_DIGITS = 3;
const SMALL_BALANCE_FRACTION_DIGITS = 8;

export function formatAssetBalance(balance: number) {
  if (!Number.isFinite(balance)) {
    return "0";
  }

  const absolute = Math.abs(balance);
  const isSmall = absolute > 0 && absolute < 1;

  const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: isSmall ? DEFAULT_FRACTION_DIGITS : DEFAULT_FRACTION_DIGITS,
    maximumFractionDigits: isSmall ? SMALL_BALANCE_FRACTION_DIGITS : DEFAULT_FRACTION_DIGITS,
  });

  return formatter.format(balance);
}
