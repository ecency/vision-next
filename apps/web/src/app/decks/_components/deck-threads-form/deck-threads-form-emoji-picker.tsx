import React, { useRef, useState } from "react";
import { Button } from "@ui/button";
import { UilSmile } from "@tooni/iconscout-unicons-react";
import { EmojiPicker } from "@/features/ui/emoji-picker/lazy-emoji-picker";

interface Props {
  onPick: (v: string) => void;
}

export const DeckThreadsFormEmojiPicker = ({ onPick }: Props) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="deck-threads-form-emoji-picker">
      <Button
        ref={buttonRef}
        appearance="gray-link"
        icon={<UilSmile />}
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
