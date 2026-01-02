import React, { useRef, useState } from "react";
import { Button } from "@ui/button";
import { UilSmile } from "@tooni/iconscout-unicons-react";
import { EmojiPicker } from "@/features/ui";

interface Props {
  onPick: (v: string) => void;
  disabled?: boolean;
}

export const WaveFormEmojiPicker = ({ onPick, disabled }: Props) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="deck-threads-form-emoji-picker">
      <Button
        ref={buttonRef}
        appearance="gray-link"
        icon={<UilSmile />}
        disabled={disabled}
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      />
      {showEmojiPicker && (
        <EmojiPicker
          show={showEmojiPicker}
          changeState={(state) => setShowEmojiPicker(state)}
          onSelect={(value) => onPick(value)}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
};
