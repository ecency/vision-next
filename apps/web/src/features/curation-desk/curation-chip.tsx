"use client";

import clsx from "clsx";

interface ChipProps {
  tone?: "green" | "amber" | "red" | "gray" | "blue";
  title?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * The one chip of the desk. It lives in its own module so the recommender
 * scorecard can use it without importing the badges module, which imports the
 * scorecard back.
 */
export function Chip({ tone = "gray", title, className, children }: ChipProps) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-4 whitespace-nowrap",
        tone === "green" && "bg-green-040 text-green-ink dark:bg-green/20 dark:text-green-030",
        tone === "amber" && "bg-warning-040 text-warning-ink dark:bg-warning-default/20 dark:text-warning-default",
        tone === "red" && "bg-red/10 text-red-030 dark:bg-red/20 dark:text-red-light-020",
        // dark:text-blue-dark-sky-active on dark:bg-blue-dark-grey was two dark blues at
        // 1.7:1, against 8.5 and 11.4 for the gray and green tones. dark-sky-020 is
        // 5.4:1 on the same ground. This tone carries the Recommended chip on every
        // row and the reason chips in the quick view, so it was live everywhere.
        tone === "blue" && "bg-blue-duck-egg text-blue-dark-sky dark:bg-blue-dark-grey dark:text-blue-dark-sky-020",
        tone === "gray" && "bg-gray-100 text-gray-600 dark:bg-dark-default dark:text-gray-400",
        className
      )}
    >
      {children}
    </span>
  );
}
