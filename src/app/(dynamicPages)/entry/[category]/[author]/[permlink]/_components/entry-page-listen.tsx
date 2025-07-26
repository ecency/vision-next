"use client";

import { Entry } from "@/entities";
import { TextToSpeechSettingsDialog, useTts } from "@/features/text-to-speech";
import { Button } from "@/features/ui";
import { getPurePostText } from "@/utils";
import { UilPause, UilPlay, UilSetting } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useRef, useState } from "react";
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
  const { speechRef, hasPaused, hasStarted } = useTts(getPurePostText(entry.body));

  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

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

  return (
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
  );
}
