import { UilPause, UilPlay } from "@tooni/iconscout-unicons-react";
import { Button } from "../ui";
import { useTts } from "./use-tts";
import React, { useCallback, useMemo } from "react";
import clsx from "clsx";

interface Props {
  voice: SpeechSynthesisVoice;
  text: string;
  selected: SpeechSynthesisVoice | undefined;
  onSelect: () => void;
}

export function TextToSpeechSettingsItem({ voice, text, selected, onSelect }: Props) {
  const { hasStarted, speechRef, voice: activeVoice } = useTts(text);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!speechRef.current) {
        return;
      }

      speechRef.current.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speechRef.current);
    },
    [speechRef, voice]
  );

  return (
    <div
      className={clsx(
        "flex justify-between h-full border border-[--border-color] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 duration-300 rounded-xl p-2",
        selected?.voiceURI === voice.voiceURI && "border-blue-dark-sky text-blue-dark-sky"
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="text-sm">{voice.name.replace(/\(.*\)/gim, "")}</div>
        <div className="text-sm text-black dark:text-white opacity-50">{voice.lang}</div>
      </div>
      <Button
        className="mt-1"
        appearance="gray-link"
        icon={hasStarted ? <UilPause /> : <UilPlay />}
        size="sm"
        onClick={handleClick}
      />
    </div>
  );
}
