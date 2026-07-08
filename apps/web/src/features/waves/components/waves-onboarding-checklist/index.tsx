"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { getQuestsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilCheckCircle, UilTimes } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import i18next from "i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  deriveWavesOnboardingState,
  WavesOnboardingItem,
  WavesOnboardingItemId
} from "./derive-waves-onboarding-state";

/**
 * Dismissible "Getting started" checklist for new accounts, nudging the first
 * Wave as the entry action. Completion is derived from the daily quests API and
 * latched per-user in localStorage so items never un-check when the daily
 * window resets. Once every item is done it celebrates once, then hides for good.
 */
export function WavesOnboardingChecklist() {
  const { activeUser } = useActiveAccount();

  if (!activeUser) {
    return null;
  }

  // Keyed by username so the per-user localStorage keys re-read on account switch.
  return <ChecklistContent key={activeUser.username} username={activeUser.username} />;
}

// On /waves the composer is on the page; elsewhere (e.g. the personal feed,
// where new users land after login) fall back to navigating there.
function focusWaveComposer(navigateToWaves: () => void) {
  const form = document.getElementById("wave-form");
  if (!form) {
    navigateToWaves();
    return;
  }
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  const textarea = form.querySelector("textarea");
  textarea?.focus({ preventScroll: true });
}

function ChecklistContent({ username }: { username: string }) {
  const { account } = useActiveAccount();
  const { data: quests } = useQuery(getQuestsQueryOptions(username));

  const [dismissed, setDismissed] = useSynchronizedLocalStorage<boolean>(
    PREFIX + "_waves_onboarding_dismissed_" + username,
    false
  );
  // Daily quest progress resets at 00:00 UTC; latch completions so a finished
  // item stays checked on later days.
  const [latched, setLatched] = useSynchronizedLocalStorage<WavesOnboardingItemId[]>(
    PREFIX + "_waves_onboarding_done_" + username,
    []
  );
  const [celebrated, setCelebrated] = useSynchronizedLocalStorage<boolean>(
    PREFIX + "_waves_onboarding_celebrated_" + username,
    false
  );
  // Latched for this mount only: the completion state renders once, then the
  // persisted flag hides the card on the next mount.
  const [celebrating, setCelebrating] = useState(false);

  const state = useMemo(
    () => deriveWavesOnboardingState(quests, account, latched ?? []),
    [quests, account, latched]
  );

  useEffect(() => {
    if (!state) {
      return;
    }
    const done = state.items.filter((i) => i.completed).map((i) => i.id);
    const prev = latched ?? [];
    if (done.some((id) => !prev.includes(id))) {
      setLatched(done);
    }
  }, [state, latched, setLatched]);

  useEffect(() => {
    if (state?.allComplete && !celebrated) {
      setCelebrating(true);
      setCelebrated(true);
    }
  }, [state?.allComplete, celebrated, setCelebrated]);

  if (!state || !state.eligible || dismissed || (state.allComplete && !celebrating)) {
    return null;
  }

  const pct = Math.round((state.completedCount / state.totalCount) * 100);

  return (
    <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 mb-4 relative">
      <button
        type="button"
        aria-label={i18next.t("waves.onboarding.dismiss")}
        className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => setDismissed(true)}
      >
        <UilTimes className="w-4 h-4" />
      </button>
      {state.allComplete ? (
        <div className="flex flex-col gap-1 pr-8">
          <div className="font-semibold">{i18next.t("waves.onboarding.all-done-title")}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("waves.onboarding.all-done-subtitle")}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 pr-8">
            <div className="font-semibold">{i18next.t("waves.onboarding.title")}</div>
            <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums shrink-0">
              {i18next.t("waves.onboarding.progress", {
                completed: state.completedCount,
                total: state.totalCount
              })}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("waves.onboarding.subtitle")}
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              style={{ width: `${pct}%` }}
              className="h-full rounded-full bg-blue-dark-sky duration-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            {state.items.map((item) => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ item }: { item: WavesOnboardingItem }) {
  const router = useRouter();
  const label = i18next.t(`waves.onboarding.item-${item.id}`);
  const content = (
    <>
      {item.completed ? (
        <UilCheckCircle className="w-5 h-5 shrink-0 text-green-500" />
      ) : (
        <span className="w-5 h-5 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600" />
      )}
      <span className={clsx("text-sm", item.completed && "line-through opacity-50")}>{label}</span>
    </>
  );
  const rowClassName = "flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5";

  if (!item.completed && item.id === "wave") {
    return (
      <button
        type="button"
        className={clsx(
          rowClassName,
          "text-left hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-dark-sky font-semibold"
        )}
        onClick={() => focusWaveComposer(() => router.push("/waves"))}
      >
        {content}
      </button>
    );
  }

  if (!item.completed && item.id === "checkin") {
    return (
      <Link
        href="/perks"
        className={clsx(
          rowClassName,
          "hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-dark-sky font-semibold"
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
