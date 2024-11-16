import React, { useContext } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { WaveFormToolbar } from "./wave-form-toolbar";
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
  onAddImage: (url: string, name: string) => void;
  onAddVideo: (value: string | undefined) => void;
  placeholder?: string;
  onTextareaFocus: () => void;
}

export const WaveFormControl = ({
  text,
  setText,
  onAddImage,
  selectedImage,
  setSelectedImage,
  placeholder,
  onTextareaFocus,
  onAddVideo,
  video
}: Props) => {
  const { activePoll } = useContext(PollsContext);

  return (
    <>
      <div className="comment-body">
        <div className="editor">
          <TextareaAutosize
            className="editor-control"
            placeholder={placeholder ?? i18next.t("decks.threads-form.input-placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={onTextareaFocus}
          />
          <div className="length-prompt">{text.length}/255</div>
        </div>
        {selectedImage && (
          <div className="deck-threads-form-selected-image border mb-3">
            <div className="type">image</div>
            <Image width={1000} height={1000} src={selectedImage} alt="" />
            <div className="remove" onClick={() => setSelectedImage(undefined)}>
              {closeSvg}
            </div>
          </div>
        )}
        {video && (
          <div className="deck-threads-form-selected-image border mb-3">
            <div className="type">video</div>
            <Image
              width={1000}
              height={1000}
              src={video
                .matchAll(/<center>\[!\[](.*)].*<\/center>/g)
                .next()
                .value[1].replace("(", "")
                .replace(")", "")}
              alt=""
            />
            <div className="remove" onClick={() => onAddVideo(undefined)}>
              {closeSvg}
            </div>
          </div>
        )}
        {activePoll && (
          <div className="py-4">
            <PollWidget compact={true} poll={activePoll} isReadOnly={true} />
          </div>
        )}
        <WaveFormToolbar
          onAddImage={onAddImage}
          onEmojiPick={(v) => setText(`${text}${v}`)}
          onAddVideo={onAddVideo}
        />
      </div>
    </>
  );
};
