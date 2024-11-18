import React, { useContext } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { PollsContext, PollWidget } from "@/features/polls";
import i18next from "i18next";
import { closeSvg } from "@ui/svg";
import Image from "next/image";

interface Props {
  text: string;
  setText: (v: string) => void;
  video: string | undefined;
  selectedImage: string | undefined;
  setSelectedImage: (url: string | undefined) => void;
  placeholder?: string;
  onTextareaFocus: () => void;
}

export const WaveFormControl = ({
  text,
  setText,
  selectedImage,
  setSelectedImage,
  placeholder,
  onTextareaFocus
}: Props) => {
  const { activePoll } = useContext(PollsContext);

  return (
    <div className="pt-4">
      <TextareaAutosize
        className="w-full min-h-[8rem] outline-none border-0 resize-none bg-transparent"
        placeholder={placeholder ?? i18next.t("decks.threads-form.input-placeholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={onTextareaFocus}
      />
      <div className="text-xs opacity-50 pb-2">{text?.length ?? 0}/255</div>
      {selectedImage && (
        <div className="deck-threads-form-selected-image border mb-3">
          <div className="type">image</div>
          <Image width={1000} height={1000} src={selectedImage} alt="" />
          <div className="remove" onClick={() => setSelectedImage(undefined)}>
            {closeSvg}
          </div>
        </div>
      )}
      {activePoll && (
        <div className="py-4">
          <PollWidget compact={true} poll={activePoll} isReadOnly={true} />
        </div>
      )}
    </div>
  );
};
