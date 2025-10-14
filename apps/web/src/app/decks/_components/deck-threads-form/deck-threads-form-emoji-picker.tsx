import React, { useEffect, useRef, useState } from "react";
import { Button } from "@ui/button";
import { UilSmile } from "@tooni/iconscout-unicons-react";
import { EmojiPicker } from "@/features/ui";

interface Props {
  onPick: (v: string) => void;
}

export const DeckThreadsFormEmojiPicker = ({ onPick }: Props) => {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState<Element | null>(null);

  useEffect(() => {
    if (!anchorRef.current) {
      return;
    }

    setAnchor(anchorRef.current);
  }, []);

  return (
    <div className="deck-threads-form-emoji-picker">
      <Button appearance="gray-link" ref={anchorRef} icon={<UilSmile />} />
      <EmojiPicker anchor={anchor} onSelect={(value) => onPick(value)} />
    </div>
  );
};
