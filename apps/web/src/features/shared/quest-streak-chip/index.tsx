"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Tooltip } from "@ui/tooltip";
import { getQuestsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import Link from "next/link";
import { deriveQuestChipState } from "./derive-quest-chip-state";

interface Props {
  className?: string;
}

/**
 * Compact daily-quest pill for the composers: shows the unfinished daily post
 * quest and/or the current streak flame (orange when the streak is at risk)
 * and links to /perks. Renders nothing while the quests query loads, for
 * logged-out users, or when there is nothing to nudge about.
 */
export function QuestStreakChip({ className }: Props) {
  const { activeUser } = useActiveAccount();
  const { data: quests } = useQuery(getQuestsQueryOptions(activeUser?.username));

  const state = deriveQuestChipState(quests);

  if (!activeUser || !state?.visible) {
    return null;
  }

  return (
    <Tooltip content={i18next.t("quest-chip.tooltip")}>
      <Link
        href="/perks"
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
          state.atRisk
            ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300"
            : "bg-blue-duck-egg dark:bg-gray-800 text-blue-dark-sky",
          className
        )}
      >
        {!state.postedToday && (
          <span>
            {i18next.t("quest-chip.daily-post", {
              progress: state.postProgress,
              goal: state.postGoal
            })}
          </span>
        )}
        {state.streak > 0 && (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden>🔥</span>
            <span>{state.streak > 99 ? "99+" : state.streak}</span>
          </span>
        )}
      </Link>
    </Tooltip>
  );
}
