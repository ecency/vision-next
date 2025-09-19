export const TEXT_COLORS = [
  "#000000",
  "#1f2937",
  "#4b5563",
  "#64748b",
  "#16a34a",
  "#22c55e",
  "#0ea5e9",
  "#2563eb",
  "#7c3aed",
  "#f97316",
  "#f59e0b",
  "#dc2626",
  "#ec4899"
] as const;

export type TextColor = (typeof TEXT_COLORS)[number];

export const TEXT_COLOR_CLASS_PREFIX = "ecency-text-color-";

export function normalizeTextColor(color?: string | null): TextColor | null {
  if (!color) {
    return null;
  }

  const trimmed = color.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.startsWith("#")
    ? `#${trimmed.slice(1).toLowerCase()}`
    : `#${trimmed.toLowerCase()}`;

  const match = TEXT_COLORS.find((item) => item === normalized);

  return match ?? null;
}

export function getTextColorClassName(color: TextColor): string {
  return `${TEXT_COLOR_CLASS_PREFIX}${color.replace("#", "")}`;
}

export function getTextColorFromClassName(className: string): TextColor | null {
  if (!className.startsWith(TEXT_COLOR_CLASS_PREFIX)) {
    return null;
  }

  const value = className.slice(TEXT_COLOR_CLASS_PREFIX.length);
  if (!value) {
    return null;
  }

  const candidate = `#${value.toLowerCase()}` as TextColor;

  return normalizeTextColor(candidate);
}
