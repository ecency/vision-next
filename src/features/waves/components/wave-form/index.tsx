"use client";

import React, { useCallback, useContext, useEffect, useMemo } from "react";
import "./_index.scss";
import { Entry, WaveEntry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { PollsContext } from "@/features/polls";
import { useLocalStorage } from "react-use";
import { PREFIX } from "@/utils/local-storage";
import { AvailableCredits, ProfileLink, UserAvatar } from "@/features/shared";
import { WaveFormThreadSelection } from "./wave-form-thread-selection";
import { WaveFormControl } from "./wave-form-control";
import i18next from "i18next";
import { Button } from "@ui/button";
import { WaveFormToolbar } from "@/features/waves/components/wave-form/wave-form-toolbar";
import { useWaveSubmit } from "@/features/waves";

interface Props {
  className?: string;
  placeholder?: string;
  replySource?: Entry;
  onSuccess?: (reply: Entry) => void;
  hideAvatar?: boolean;
  entry: WaveEntry | undefined;
}

export const WaveForm = ({
  placeholder,
  replySource,
  onSuccess,
  hideAvatar = false,
  entry
}: Props) => {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { clearActivePoll } = useContext(PollsContext);

  const [threadHost, setThreadHost] = useLocalStorage(PREFIX + "_dtf_th", "ecency.waves");
  const [text, setText, clearText] = useLocalStorage(PREFIX + "_dtf_t", "");
  const [image, setImage, clearImage] = useLocalStorage<string>(PREFIX + "_dtf_i", "");
  const [imageName, setImageName, clearImageName] = useLocalStorage<string>(PREFIX + "_dtf_in", "");
  const [video, setVideo, clearVideo] = useLocalStorage<string>(PREFIX + "_dtf_v", "");

  const disabled = useMemo(() => !text || !threadHost, [text, threadHost]);

  useEffect(() => {
    if (entry) {
      let nextText = entry.body.replace("<br>", "\n").replace("<p>", "").replace("</p>", "");
      const nextImage = entry.body.match(/\!\[.*\]\(.+\)/g)?.[0];
      if (nextImage) {
        setImage(
          nextImage
            .replace(/\!\[.*\]/g, "")
            .replace("(", "")
            .replace(")", "")
        );
        nextText = nextText.replace(nextImage, "");
      }
      setText(nextText);
    }
  }, [entry, setImage, setText]);

  const clear = useCallback(() => {
    clearText();
    clearImage();
    clearImageName();
    clearActivePoll();
    clearVideo();
  }, [clearActivePoll, clearImage, clearImageName, clearText, clearVideo]);

  const { mutateAsync: submit, isPending } = useWaveSubmit(entry, replySource, (item) => {
    clear();
    onSuccess?.(item);
  });

  return (
    <div className="wave-form relative flex items-start px-4 pt-4 w-full">
      {!hideAvatar && (
        <UserAvatar
          username={activeUser?.username ?? ""}
          size={replySource ? "deck-item" : "medium"}
        />
      )}
      <div className="pl-4 w-full">
        {replySource ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("waves.reply-form-title")}
            <ProfileLink className="text-blue-dark-sky pl-0.5" username={replySource.author}>
              @{replySource.author}
            </ProfileLink>
          </div>
        ) : (
          <WaveFormThreadSelection host={threadHost} setHost={setThreadHost} />
        )}
        <WaveFormControl
          video={video}
          text={text!!}
          setText={setText}
          selectedImage={image!!}
          setSelectedImage={setImage}
          placeholder={placeholder}
          onTextareaFocus={() => {}}
        />
        {activeUser && (
          <AvailableCredits username={activeUser.username} operation="comment_operation" />
        )}
        <WaveFormToolbar
          onAddImage={(url, name) => {
            setImage(url);
            setImageName(name);
          }}
          onEmojiPick={(v) => setText(`${text}${v}`)}
          onAddVideo={setVideo}
          submit={
            <Button
              onClick={() =>
                !disabled &&
                submit({
                  text: text!!,
                  imageName: imageName!!,
                  image: image!!,
                  host: threadHost!!,
                  video: video!!
                })
              }
              disabled={disabled}
              isLoading={isPending}
              className="justify-self-end"
              size="sm"
            >
              {!activeUser &&
                !entry &&
                (text?.length ?? 0) <= 255 &&
                i18next.t("decks.threads-form.login-and-publish")}
              {activeUser &&
                !entry &&
                (text?.length ?? 0) <= 255 &&
                (isPending
                  ? i18next.t("decks.threads-form.publishing")
                  : i18next.t("decks.threads-form.publish"))}
              {(text?.length ?? 0) > 255 &&
                !entry &&
                i18next.t("decks.threads-form.create-regular-post")}
              {entry && i18next.t("decks.threads-form.save")}
            </Button>
          }
        />
      </div>
    </div>
  );
};
