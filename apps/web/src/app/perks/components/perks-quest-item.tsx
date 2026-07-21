"use client";

import { UilCheckCircle } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import i18next from "i18next";
import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  progress: number;
  goal: number;
  /** quest met its goal for the period */
  completed?: boolean;
  /** small trailing note, e.g. "Available now" or a reward hint */
  hint?: string;
  /** the soft reward cap (where the existing reward decays to ~0); shown subtly */
  cap?: number;
  onClick?: () => void;
}

export function PerksQuestItem({
  icon,
  title,
  progress,
  goal,
  completed = false,
  hint,
  cap,
  onClick
}: Props) {
  const pct = goal > 0 ? Math.min(100, Math.round((progress / goal) * 100)) : 0;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={clsx(
        "flex items-center gap-3 rounded-xl border p-3 bg-white dark:bg-gray-900 transition-colors",
        completed
          ? "border-green-200 dark:border-green-900"
          : "border-gray-200 dark:border-gray-800",
        onClick && "cursor-pointer hover:border-blue-dark-sky"
      )}
    >
      <div
        className={clsx(
          "shrink-0 size-9 rounded-full flex items-center justify-center [&>svg]:size-6",
          completed
            ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
            : "bg-blue-duck-egg dark:bg-gray-800 text-blue-dark-sky"
        )}
      >
        {completed ? <UilCheckCircle /> : icon}
      </div>

      <div className="flex flex-col gap-1 min-w-0 grow">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">{title}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0 tabular-nums">
            {hint ?? `${progress}/${goal}`}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className={clsx("h-full rounded-full", completed ? "bg-green-500" : "bg-blue-dark-sky")}
          />
        </div>
        {typeof cap === "number" && progress >= cap && (
          <span className="text-[11px] text-gray-500">
            ✓ {i18next.t("perks.quests.max-rewards")}
          </span>
        )}
      </div>
    </div>
  );
}
