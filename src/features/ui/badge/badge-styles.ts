export type BadgeAppearance = "primary" | "secondary";

export const BADGE_STYLES: Record<BadgeAppearance, string> = {
  primary:
    "bg-blue-dark-sky-040 border border-blue-dark-sky-030 text-blue-dark-sky dark:bg-dark-default text-xs font-bold dark:border-blue-metallic-20 dark:text-gray-200",
  secondary:
    "bg-gray-400 text-gray-600 dark:bg-gray-600 dark:text-gray-400 text-xs font-bold border border-gray-400 dark:border-gray-600"
};
