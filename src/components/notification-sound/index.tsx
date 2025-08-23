import { forwardRef, useImperativeHandle, useRef } from "react";

export interface NotificationSoundRef {
  playSound: () => void;
}

export const NotificationSound = forwardRef<NotificationSoundRef>((_, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useImperativeHandle(ref, () => ({
    playSound: () => {
      audioRef.current?.play().catch((e) => console.warn("Failed to play notification sound:", e));
    },
  }));

  return <audio ref={audioRef} src="/assets/notification.mp3" style={{ display: "none" }} />;
});