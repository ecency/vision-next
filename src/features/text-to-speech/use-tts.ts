import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { useEffect, useRef, useState } from "react";

export function useTts(text: string) {
  const speechRef = useRef<SpeechSynthesisUtterance>();

  const [hasStarted, setHasStarted] = useState(false);
  const [hasPaused, setHasPaused] = useState(false);

  const [voice] = useSynchronizedLocalStorage<string>(PREFIX + "_tts_voice");

  useEffect(() => {
    if (speechRef.current) {
      speechRef.current = undefined;
      setHasPaused(false);
      setHasStarted(false);
    }
    speechRef.current = new SpeechSynthesisUtterance(text.replaceAll(/^[^\w]+?/g, "").trim());

    if (voice) {
      const voices = window.speechSynthesis.getVoices();
      const foundVoice = voices.find((vc) => vc.voiceURI === voice);
      if (foundVoice) {
        speechRef.current.voice = foundVoice;
      }
    }

    speechRef.current.addEventListener("start", () => setHasStarted(true));
    speechRef.current.addEventListener("end", () => setHasStarted(false));
    speechRef.current.addEventListener("pause", () => setHasPaused(true));
    speechRef.current.addEventListener("resume", () => setHasPaused(false));

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
