"use client";

import { Entry } from "@/entities";
import { Button } from "@/features/ui";
import { UilPause, UilPlay } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useRef, useState } from "react";
import { useMount } from "react-use";

interface Props {
  entry: Entry;
}

function countWords(entry: string) {
  const cjkEntry = new RegExp("[\u4E00-\u9FFF]", "g");
  entry = entry.replace(cjkEntry, " {CJK} ");
  const splitEntry: any = entry.trim().split(/\s+/);
  const cjkCount = splitEntry.filter((e: string) => e === "{CJK}");
  const count: any = splitEntry.includes("{CJK}") ? cjkCount.length : splitEntry.length;
  return count;
}

export function EntryPageListen({ entry }: Props) {
  const speechRef = useRef<SpeechSynthesisUtterance>();

  const [hasStarted, setHasStarted] = useState(false);
  const [hasPaused, setHasPaused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

  useMount(() => {
    speechRef.current = new SpeechSynthesisUtterance(entry.body.replaceAll(/^[^\w]+?/g, "").trim());

    speechRef.current.addEventListener("start", () => setHasStarted(true));
    speechRef.current.addEventListener("end", () => setHasStarted(false));
    speechRef.current.addEventListener("pause", () => setHasPaused(true));
    speechRef.current.addEventListener("resume", () => setHasPaused(false));

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
  }, [hasPaused, hasStarted]);

  return (
    <div className="border border-[--border-color] rounded-xl grid grid-cols-2 items-center">
      <div className="grid grid-cols-2 gap-2 p-2 border-r border-[--border-color]">
        <div>
          <div className="text-sm opacity-50">{i18next.t("entry.post-word-count")}</div>
          <div className="text-sm">{wordCount}</div>
        </div>
        <div>
          <div className="text-sm opacity-50">{i18next.t("entry.post-read-time")}</div>
          <div className="text-sm">
            {readTime} {i18next.t("entry.post-read-minutes")}
          </div>
        </div>
      </div>
      <div className="flex items-center w-full gap-2 justify-between p-2 ">
        <div className="flex flex-col">
          <div className="text-sm opacity-50">Listen to post</div>
          <div className="cursor-pointer text-blue-dark-sky hover:text-blue-dark-sky-hover text-xs">
            Settings
          </div>
        </div>
        <Button
          appearance="gray"
          size="sm"
          icon={hasPaused || !hasStarted ? <UilPlay /> : <UilPause />}
          onClick={handleClick}
        />
      </div>
    </div>
  );
}
