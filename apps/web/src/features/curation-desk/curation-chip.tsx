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
        tone === "green" && "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
        tone === "amber" && "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        tone === "red" && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        tone === "blue" && "bg-blue-duck-egg text-blue-dark-sky dark:bg-blue-dark-grey dark:text-blue-dark-sky-active",
        tone === "gray" && "bg-gray-100 text-gray-600 dark:bg-dark-default dark:text-gray-400",
        className
      )}
    >
      {children}
    </span>
  );
}
