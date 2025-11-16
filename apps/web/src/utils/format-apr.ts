export function formatApr(apr?: number | string | null) {
  if (apr === undefined || apr === null) {
    return undefined;
  }

  const aprNumber = typeof apr === "string" ? Number.parseFloat(apr) : apr;

  if (!Number.isFinite(aprNumber)) {
    return apr?.toString();
  }

  return Number.isInteger(aprNumber)
    ? aprNumber.toString()
    : aprNumber.toFixed(2);
}
