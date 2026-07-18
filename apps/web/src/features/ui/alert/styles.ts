import { Appearance } from "./types";

export const ALERT_STYLES: Record<Appearance, string> = {
  primary:
    "bg-blue-dark-sky-040 border border-blue-dark-sky-030 text-blue-dark-sky dark:bg-dark-default dark:border-dark-300 dark:text-gray-100",
  secondary:
    "bg-gray-100 border border-gray-200 text-gray-600 dark:bg-opacity-[20%] dark:border-opacity-[20%]",
  success:
    "bg-green-040 border border-green-030 text-green dark:bg-opacity-[20%] dark:border-opacity-[20%]",
  warning:
    "bg-warning-040 border border-warning-030 text-orange dark:bg-opacity-[20%] dark:border-opacity-[20%] dark:text-warning-default",
  // red-040 (#ec3323) is a vivid red used elsewhere as a solid badge with white text; pairing
  // it as a background with the muted `text-red` gave low-contrast red-on-red (unreadable).
  // Use a light red TINT background with dark-red text, matching the other alerts' pattern.
  danger:
    "bg-red-040/10 border border-red-030 text-red-030 dark:bg-red-040/20 dark:border-red-030 dark:text-red-light-020"
};
