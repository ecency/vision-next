import React, { useContext } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { PollsContext, PollWidget } from "@/features/polls";
import i18next from "i18next";
import Image from "next/image";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { UilMultiply } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";

interface Props {
  text: string;
  setText: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  video: string | undefined;
  selectedImage: string | undefined;
  clearSelectedImage: () => void;
  clearVideo?: () => void;
  placeholder?: string;
  characterLimit: number;
  onPasteImage?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export const WaveFormControl = ({
  text,
  setText,
  selectedImage,
  clearSelectedImage,
  clearVideo,
  video,
  characterLimit,
  placeholder,
  textareaRef,
  onPasteImage,
  disabled
}: Props) => {
  const { activePoll } = useContext(PollsContext);
  const textLength = text?.length ?? 0;
  const counterClassName = clsx(
    "text-xs pb-2 transition-colors",
    textLength > characterLimit
      ? "text-red-500"
      : textLength > characterLimit - 35
        ? "text-amber-500"
        : "text-gray-500 dark:text-gray-300"
  );

  const showCounter = textLength > 0;

  return (
    <div className="flex items-start gap-4 flex-wrap py-1">
      <div className="w-full">
        <TextareaAutosize
          disabled={disabled}
          className={clsx(
            "w-full px-0 py-1.5 bg-transparent outline-none border-0 resize-none min-h-[2.5rem] text-[0.95rem] leading-6 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-blue-400 rounded-sm",
            disabled && "opacity-60 cursor-not-allowed"
          )}
          placeholder={placeholder ?? i18next.t("decks.threads-form.input-placeholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          ref={textareaRef}
          onPaste={onPasteImage}
        />
        {showCounter && (
          <div className={counterClassName} aria-live="polite">
            {textLength}/{characterLimit}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 0.875, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, scale: 0.875, height: 0 }}
            className="max-w-[320px] rounded-2xl relative overflow-hidden border border-[--border-color] mb-3"
          >
            <Badge className="absolute top-4 left-4 text-xs uppercase">image</Badge>
            <Image width={1000} height={1000} src={selectedImage} alt="" />
            <Button
              appearance="danger"
              size="sm"
              icon={<UilMultiply />}
              className="absolute top-4 right-4"
              onClick={() => clearSelectedImage()}
            />
          </motion.div>
        )}
        {video && (
          <motion.div
            key="video"
            initial={{ opacity: 0, scale: 0.875, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, scale: 0.875, height: 0 }}
            className="max-w-[320px] rounded-2xl relative overflow-hidden border border-[--border-color] mb-3 flex items-center justify-center bg-gray-100 dark:bg-dark-default p-4"
          >
            <Badge className="absolute top-4 left-4 text-xs uppercase">
              {i18next.t("video-upload.short-badge")}
            </Badge>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-4">
              {i18next.t("video-upload.video-attached")}
            </div>
            {clearVideo && (
              <Button
                appearance="danger"
                size="sm"
                icon={<UilMultiply />}
                className="absolute top-4 right-4"
                onClick={clearVideo}
                aria-label={i18next.t("g.clear")}
              />
            )}
          </motion.div>
        )}
        {activePoll && (
          <motion.div
            key="poll"
            initial={{ opacity: 0, scale: 0.875, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, scale: 0.875, height: 0 }}
            className="max-w-[320px]"
          >
            <PollWidget compact={true} poll={activePoll} isReadOnly={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
