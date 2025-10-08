export function normalizeBeneficiaryWeight(weight: unknown): number | undefined {
  if (typeof weight === "number") {
    return Number.isFinite(weight) ? weight : undefined;
  }

  if (typeof weight === "string" && weight.trim().length > 0) {
    const parsed = Number(weight);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}
