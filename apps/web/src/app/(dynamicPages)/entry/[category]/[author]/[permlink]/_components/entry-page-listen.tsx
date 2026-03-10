"use client";

import { EcencyConfigManager } from "@/config";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Entry } from "@/entities";
import { error, success, LoginRequired } from "@/features/shared";
import { TextToSpeechSettingsDialog, useTts } from "@/features/text-to-speech";
import { Button } from "@/features/ui";
import { getAccessToken, ensureValidToken, getPurePostText } from "@/utils";
import { useAiAssist } from "@ecency/sdk";
import { UilPause, UilPlay, UilSetting } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useMount } from "react-use";

interface Props {
  entry: Entry;
}

function countWords(entry: string): number {
  const words = getPurePostText(entry)
    .trim()
    .split(/\s+/)
    .filter((word) => word);
  return words.length;
}

export function EntryPageListen({ entry }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const accessToken = username ? getAccessToken(username) : undefined;

  const text = useMemo(() => getPurePostText(entry.body), [entry]);
  const { speechRef, hasPaused, hasStarted } = useTts(text);

  const { mutateAsync: runAssist, isPending: isSummarizing } = useAiAssist(username, accessToken);

  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);

  useMount(() => {
    const entryCount = countWords(entry.body);
    const wordPerMinuite: number = 225;
    setWordCount(entryCount);
    setReadTime(Math.ceil(entryCount / wordPerMinuite));
  });

  const handleClick = useCallback(() => {
    if (!speechRef.current) {
      return;
    }
    if (hasPaused) {
      window.speechSynthesis.resume();
    } else if (hasStarted) {
      window.speechSynthesis.pause();
    } else {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speechRef.current);
    }
  }, [hasPaused, hasStarted, speechRef]);

  const handleSummarize = useCallback(async () => {
    if (!username) return;

    try {
      const token = await ensureValidToken(username);
      if (!token) {
        error(i18next.t("ai-assist.error-auth"));
        return;
      }

      const res = await runAssist({
        action: "summarize",
        text: text.slice(0, 10000),
      });

      setSummary(res.output);
      success(i18next.t("ai-assist.success"));
    } catch (err: any) {
      const status = err?.status;
      if (status === 402) {
        error(i18next.t("ai-assist.error-insufficient-points"));
      } else if (status === 429) {
        error(i18next.t("ai-assist.error-rate-limit"));
      } else {
        error(i18next.t("ai-assist.error-generic"));
      }
    }
  }, [username, runAssist, text]);

  return (
    <div className="flex flex-col gap-2">
      <div className="border border-[--border-color] rounded-xl grid grid-cols-3 items-center min-w-[275px]">
        <div className="border-r border-[--border-color] p-2">
          <div className="text-sm opacity-50">{i18next.t("entry.post-word-count")}</div>
          <div className="text-sm">{wordCount}</div>
        </div>
        <div className="border-r border-[--border-color] p-2">
          <div className="text-sm opacity-50">{i18next.t("entry.post-read-time")}</div>
          <div className="text-sm">
            {readTime} {i18next.t("entry.post-read-minutes")}
          </div>
        </div>

        <div className="w-full gap-2 justify-between p-2">
          <div className="flex justify-between items-center">
            <div className="text-sm opacity-50">{i18next.t("entry.listen")}</div>
            <TextToSpeechSettingsDialog>
              <Button
                appearance="gray-link"
                size="xs"
                icon={<UilSetting />}
                noPadding={true}
                className="!h-4"
              />
            </TextToSpeechSettingsDialog>
          </div>
          <div
            className="text-blue-dark-sky hover:text-blue-dark-sky-hover text-sm cursor-pointer flex items-center gap-1"
            onClick={handleClick}
          >
            {hasPaused || !hasStarted ? (
              <UilPlay className="w-3.5 h-3.5" />
            ) : (
              <UilPause className="w-3.5 h-3.5" />
            )}
            {hasPaused || !hasStarted ? i18next.t("g.play") : i18next.t("g.pause")}
          </div>
        </div>
      </div>

      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.aiAssist?.enabled}
      >
        {!summary ? (
          <LoginRequired>
            <Button
              appearance="gray-link"
              size="xs"
              isLoading={isSummarizing}
              disabled={wordCount < 50}
              onClick={handleSummarize}
              icon={
                <span className="relative inline-flex">
                  <span className="text-[9px] font-bold leading-none bg-blue-dark-sky text-white rounded px-1 py-0.5">
                    AI
                  </span>
                </span>
              }
            >
              {isSummarizing
                ? i18next.t("ai-assist.submitting")
                : i18next.t("ai-assist.action-summarize")}
            </Button>
          </LoginRequired>
        ) : (
          <div className="border border-[--border-color] rounded-xl p-3">
            <div className="text-xs font-semibold opacity-50 mb-1">
              {i18next.t("ai-assist.action-summarize")}
            </div>
            <div className="text-sm whitespace-pre-wrap">{summary}</div>
          </div>
        )}
      </EcencyConfigManager.Conditional>
    </div>
  );
}
