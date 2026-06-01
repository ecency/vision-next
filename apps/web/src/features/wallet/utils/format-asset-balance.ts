const DEFAULT_FRACTION_DIGITS = 3;
const SMALL_BALANCE_FRACTION_DIGITS = 8;

export function formatAssetBalance(balance: number) {
  if (!Number.isFinite(balance)) {
    return "0";
  }

  const absolute = Math.abs(balance);
  const isSmall = absolute > 0 && absolute < 1;

  // Pin the locale: an `undefined` locale formats with the server's locale on
  // SSR and the browser's on the client, so the rendered text differs for any
  // user whose locale isn't the server default — a hydration mismatch (React
  // #418) that, during recovery, throws "removeChild" (ECENCY-NEXT-1DRM).
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: isSmall ? DEFAULT_FRACTION_DIGITS : DEFAULT_FRACTION_DIGITS,
    maximumFractionDigits: isSmall ? SMALL_BALANCE_FRACTION_DIGITS : DEFAULT_FRACTION_DIGITS,
  });

  return formatter.format(balance);
}
