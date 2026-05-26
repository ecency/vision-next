"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { TabItem } from "@/features/ui";
import { getAccessToken, useCountdown } from "@/utils";
import {
  getGameStatusCheckQueryOptions,
  getQuestsQueryOptions,
  QUEST_CATALOG,
  type QuestTier
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import {
  UilArrowUp,
  UilCheckCircle,
  UilComment,
  UilPen,
  UilRefresh,
  UilSpin
} from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import i18next from "i18next";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { PerksQuestItem } from "./perks-quest-item";

// Map the SDK catalog's icon hints to confirmed-available Unicons.
const ICONS: Record<string, ReactNode> = {
  "check-circle": <UilCheckCircle />,
  pencil: <UilPen />,
  comment: <UilComment />,
  "chevron-up-circle": <UilArrowUp />,
  repeat: <UilRefresh />,
  gift: <UilSpin />
};

const TIERS: QuestTier[] = ["daily", "weekly", "monthly"];

export function PerksQuestsSection() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const code = getAccessToken(username ?? "");

  const { data: quests } = useQuery(getQuestsQueryOptions(username));
  const { data: spin } = useQuery(getGameStatusCheckQueryOptions(username, code, "spin"));

  const [tier, setTier] = useState<QuestTier>("daily");

  const [time, setTime] = useCountdown(0);
  useEffect(() => {
    const secs = quests?.period.day_resets_in_secs;
    if (secs != null && secs >= 0) {
      setTime(secs);
    }
  }, [quests, setTime]);

  // Index the backend progress arrays by quest id, per tier.
  const byTier = useMemo(
    () => ({
      daily: Object.fromEntries((quests?.daily ?? []).map((q) => [q.id, q])),
      weekly: Object.fromEntries((quests?.weekly ?? []).map((q) => [q.id, q])),
      monthly: Object.fromEntries((quests?.monthly ?? []).map((q) => [q.id, q]))
    }),
    [quests]
  );

  const entries = useMemo(() => QUEST_CATALOG.filter((q) => q.tier === tier), [tier]);

  const streak = quests?.streak;
  const resetLabel = useMemo(() => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    return `${h}h ${m}m`;
  }, [time]);

  const scrollToSpin = () =>
    document.getElementById("perks-spin")?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 border rounded-xl overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 pb-0">
        <div>
          <div className="text-lg font-bold">{i18next.t("perks.quests.title")}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("perks.quests.subtitle")}
          </div>
        </div>
        {streak && streak.current > 0 && (
          <div
            className={clsx(
              "self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
              streak.at_risk
                ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300"
                : "bg-blue-duck-egg dark:bg-gray-800 text-blue-dark-sky"
            )}
            title={streak.at_risk ? i18next.t("perks.quests.streak-at-risk") : undefined}
          >
            <span aria-hidden>🔥</span>
            {i18next.t("perks.quests.streak", { n: streak.current })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-b mt-2 px-2">
        <div className="flex">
          {TIERS.map((t, i) => (
            <TabItem
              key={t}
              i={i}
              name={t}
              title={i18next.t(`perks.quests.${t}`)}
              isSelected={tier === t}
              onSelect={() => setTier(t)}
            />
          ))}
        </div>
        {tier === "daily" && time > 0 && (
          <div className="text-xs text-gray-500 pr-2">
            {i18next.t("perks.quests.resets-in", { time: resetLabel })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
        {entries.map((e, i) => {
          if (e.id === "spin") {
            const hasData = typeof spin?.remaining === "number" || !!spin?.wait_secs;
            const available = typeof spin?.remaining === "number" && spin.remaining > 0;
            return (
              <PerksQuestItem
                key={`${tier}-spin`}
                index={i}
                icon={ICONS[e.icon]}
                title={i18next.t("perks.quests.spin.title")}
                progress={available || !hasData ? 0 : 1}
                goal={1}
                completed={hasData && !available}
                hint={available ? i18next.t("perks.quests.available") : undefined}
                onClick={scrollToSpin}
              />
            );
          }

          const item = (byTier[tier] as Record<string, { progress: number; cap?: number }>)[e.id];
          const progress = item?.progress ?? 0;
          return (
            <PerksQuestItem
              key={`${tier}-${e.id}`}
              index={i}
              icon={ICONS[e.icon]}
              title={i18next.t(`perks.quests.${e.i18nKey}.title`)}
              progress={progress}
              goal={e.goal}
              completed={progress >= e.goal}
              cap={item?.cap}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
