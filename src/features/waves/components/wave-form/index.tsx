"use client";

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./_index.scss";
import { Entry, WaveEntry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { PollsContext, PollsManager, useEntryPollExtractor } from "@/features/polls";
import { useClickAway, useLocalStorage } from "react-use";
import { PREFIX } from "@/utils/local-storage";
import { AvailableCredits, ProfileLink, UserAvatar } from "@/features/shared";
import { WaveFormThreadSelection } from "./wave-form-thread-selection";
import { WaveFormControl } from "./wave-form-control";
import i18next from "i18next";
import { Button } from "@ui/button";
import { WaveFormToolbar } from "@/features/waves/components/wave-form/wave-form-toolbar";
import { useWaveSubmit } from "@/features/waves";
import { useClientActiveUser } from "@/api/queries";

interface Props {
  className?: string;
  placeholder?: string;
  replySource?: Entry;
  onSuccess?: (reply: Entry) => void;
  hideAvatar?: boolean;
  entry: WaveEntry | undefined;
}

const WaveFormComponent = ({
  placeholder,
  replySource,
  onSuccess,
  hideAvatar = false,
  entry
}: Props) => {
  const activeUser = useClientActiveUser();

  const rootRef = useRef<HTMLDivElement>(null);
  const { clearActivePoll, setActivePoll } = useContext(PollsContext);

  const [threadHost, setThreadHost] = useLocalStorage(PREFIX + "_wf_th", "ecency.waves");
  const [text, setText, clearText] = useLocalStorage(PREFIX + "_wf_t", "");
  const [image, setImage, clearImage] = useLocalStorage<string>(PREFIX + "_wf_i", "");
  const [imageName, setImageName, clearImageName] = useLocalStorage<string>(PREFIX + "_wf_in", "");
  const [video, setVideo, clearVideo] = useLocalStorage<string>(PREFIX + "_wf_v", "");

  const disabled = useMemo(() => !text || !threadHost, [text, threadHost]);
  const poll = useEntryPollExtractor(entry);
  useEffect(() => {
    if (poll) {
      setActivePoll(poll);
    }
  }, [poll, setActivePoll]);

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
    setText("");
    clearImage();
    clearImageName();
    clearActivePoll();
    clearVideo();
  }, [clearActivePoll, clearImage, clearImageName, clearVideo, setText]);

  const { mutateAsync: submit, isPending } = useWaveSubmit(entry, replySource, (item) => {
    clear();
    onSuccess?.(item);
  });

  return (
    <div ref={rootRef} className="wave-form relative flex items-start px-4 pt-4 w-full">
      {!hideAvatar && activeUser?.username && (
        <UserAvatar
          username={activeUser?.username ?? ""}
          size={replySource ? "deck-item" : "medium"}
        />
      )}
      <div className="pl-4 w-full">
        {replySource ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("waves.reply-form-title")}{" "}
            <ProfileLink className="text-blue-dark-sky" username={replySource.author}>
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
          selectedImage={image}
          clearSelectedImage={clearImage}
          placeholder={placeholder}
        />
        {activeUser && (
          <AvailableCredits username={activeUser.username} operation="comment_operation" />
        )}

        <WaveFormToolbar
          isEdit={!!entry}
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
                !replySource &&
                !entry &&
                (text?.length ?? 0) <= 255 &&
                (isPending
                  ? i18next.t("decks.threads-form.publishing")
                  : i18next.t("decks.threads-form.publish"))}
              {activeUser &&
                replySource &&
                !entry &&
                (text?.length ?? 0) <= 255 &&
                (isPending ? i18next.t("waves.replying") : i18next.t("waves.reply"))}
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

export function WaveForm(props: Props) {
  return (
    <PollsManager>
      <WaveFormComponent {...props} />
    </PollsManager>
  );
}

export * from "./wave-form-loading";
