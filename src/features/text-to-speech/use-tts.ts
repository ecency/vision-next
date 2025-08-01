import {getVoicesAsync, useSynchronizedLocalStorage} from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { useEffect, useRef, useState } from "react";

export function useTts(text: string) {
  const speechRef = useRef<SpeechSynthesisUtterance>();

  const [hasStarted, setHasStarted] = useState(false);
  const [hasPaused, setHasPaused] = useState(false);

  const [voice] = useSynchronizedLocalStorage<string>(PREFIX + "_tts_voice");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (speechRef.current) {
      speechRef.current = undefined;
      setHasPaused(false);
      setHasStarted(false);
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/^[^\w]+?/g, "").trim());
    speechRef.current = utterance;

    getVoicesAsync().then((voices) => {
      const foundVoice = voices.find((vc) => vc.voiceURI === voice);
      if (foundVoice) {
        utterance.voice = foundVoice;
      }
    });

    utterance.addEventListener("start", () => setHasStarted(true));
    utterance.addEventListener("end", () => setHasStarted(false));
    utterance.addEventListener("pause", () => setHasPaused(true));
    utterance.addEventListener("resume", () => setHasPaused(false));

    return () => {
      speechSynthesis.cancel();
      speechRef.current = undefined;
    };
  }, [text, voice]);

  return {
    hasPaused,
    hasStarted,
    speechRef,
    voice
  };
}
