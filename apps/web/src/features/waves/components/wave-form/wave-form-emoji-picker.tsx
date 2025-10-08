import React, { useRef } from "react";
import { Button } from "@ui/button";
import { UilSmile } from "@tooni/iconscout-unicons-react";
import { EmojiPicker } from "@/features/ui";

interface Props {
  onPick: (v: string) => void;
}

export const WaveFormEmojiPicker = ({ onPick }: Props) => {
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <Button
      appearance="gray-link"
      className="deck-threads-form-emoji-picker"
      ref={anchorRef}
      icon={<UilSmile />}
    >
      <EmojiPicker anchor={anchorRef.current} onSelect={(value) => onPick(value)} />
    </Button>
  );
};
