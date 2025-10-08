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
  video: string | undefined;
  selectedImage: string | undefined;
  clearSelectedImage: () => void;
  placeholder?: string;
}

export const WaveFormControl = ({
  text,
  setText,
  selectedImage,
  clearSelectedImage,
  placeholder
}: Props) => {
  const { activePoll } = useContext(PollsContext);
  const characterLimit = 255;
  const textLength = text?.length ?? 0;
  const counterClassName = clsx(
    "text-xs pb-2 transition-colors",
    textLength > characterLimit
      ? "text-red-500"
      : textLength > characterLimit - 35
        ? "text-amber-500"
        : "text-gray-500 dark:text-gray-300"
  );

  return (
    <div className="flex items-start gap-4 flex-wrap py-4">
      <div className="w-full">
        <TextareaAutosize
          className="w-full rounded-xl px-3 py-2 lg:px-4 bg-gray-100 dark:bg-dark-default outline-none border-0 resize-none min-h-[3.5rem] text-[0.95rem] leading-6 focus-visible:ring-2 focus-visible:ring-blue-dark-sky"
          placeholder={placeholder ?? i18next.t("decks.threads-form.input-placeholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className={counterClassName} aria-live="polite">
          {textLength}/{characterLimit}
        </div>
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
