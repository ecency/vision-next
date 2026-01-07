"use client";

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./_index.scss";
import { Entry, WaveEntry } from "@/entities";
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
import { useOptionalWavesHost } from "@/app/waves/_context";
import axios from "axios";
import { uploadImage } from "@ecency/sdk";
import { getAccessToken } from "@/utils";
import { error } from "@/features/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveAccount } from "@/core/hooks";

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
  const { username: activeUsername, account, isLoading: isAccountLoading } = useActiveAccount();

  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { clearActivePoll, setActivePoll } = useContext(PollsContext);

  const wavesHostContext = useOptionalWavesHost();
  const [threadHost, setThreadHost] = useLocalStorage(PREFIX + "_wf_th", "ecency.waves");
  const [text, setText, clearText] = useLocalStorage(PREFIX + "_wf_t", "");
  const [image, setImage, clearImage] = useLocalStorage<string>(PREFIX + "_wf_i", "");
  const [imageName, setImageName, clearImageName] = useLocalStorage<string>(PREFIX + "_wf_in", "");
  const [video, setVideo, clearVideo] = useLocalStorage<string>(PREFIX + "_wf_v", "");
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAppliedSharedText = useRef(false);

  const entryDepth = entry?.depth;
  const entryParentAuthor = entry?.parent_author;
  const isReply = useMemo(
    () => Boolean(replySource || entryDepth || entryParentAuthor),
    [entryDepth, entryParentAuthor, replySource]
  );
  const characterLimit = isReply ? 750 : 250;
  const textLength = text?.length ?? 0;
  const exceedsCharacterLimit = textLength > characterLimit;

  const poll = useEntryPollExtractor(entry);
  useEffect(() => {
    if (poll) {
      setActivePoll(poll);
    }
  }, [poll, setActivePoll]);

  useEffect(() => {
    if (entry) {
      const body = entry.body ?? "";
      let nextText = body
        .replace(/<br\s*\/?>(\n)?/gi, "\n")
        .replace(/<\/?p[^>]*>/gi, "");
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

  useEffect(() => {
    if (entry || hasAppliedSharedText.current) {
      return;
    }

    const sharedText = searchParams?.get("text")?.trim();

    if (!sharedText) {
      return;
    }

    setText(sharedText);
    hasAppliedSharedText.current = true;
    router.replace("/waves");
  }, [entry, router, searchParams, setText]);

  const contextHost = wavesHostContext?.host;

  useEffect(() => {
    if (contextHost && contextHost !== threadHost) {
      setThreadHost(contextHost);
    }
  }, [contextHost, setThreadHost, threadHost]);

  const handleThreadHostChange = useCallback(
    (nextHost: string) => {
      setThreadHost(nextHost);
      wavesHostContext?.setHost(nextHost);
    },
    [setThreadHost, wavesHostContext]
  );

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

  const formInteractivityDisabled = isAccountLoading || isPending;

  const submitDisabled = useMemo(
    () =>
      formInteractivityDisabled ||
      !text ||
      !threadHost ||
      (isReply && exceedsCharacterLimit),
    [
      exceedsCharacterLimit,
      formInteractivityDisabled,
      isReply,
      text,
      threadHost
    ]
  );

  const handleEmojiPick = useCallback(
    (emoji: string) => {
      const input = textareaRef.current;
      const currentText = text ?? "";

      if (!input) {
        setText(`${currentText}${emoji}`);
        return;
      }

      const selectionStart = input.selectionStart ?? currentText.length;
      const selectionEnd = input.selectionEnd ?? selectionStart;

      const nextValue =
        currentText.slice(0, selectionStart) + emoji + currentText.slice(selectionEnd);

      setText(nextValue);

      const restoreCaret = () => {
        const caretPosition = selectionStart + emoji.length;
        input.setSelectionRange(caretPosition, caretPosition);
        input.focus();
      };

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(restoreCaret);
      } else {
        restoreCaret();
      }
    },
    [setText, text]
  );

  const handlePasteImage = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const clipboardData = event.clipboardData;

      if (!clipboardData) {
        return;
      }

      const pastedText = clipboardData.getData("text/plain");

      if (pastedText && pastedText.length >= 50) {
        return;
      }

      const files = Array.from(clipboardData.items ?? [])
        .map((item) => (item.type.includes("image") ? item.getAsFile() : null))
        .filter((file): file is File => Boolean(file));

      if (!files.length) {
        return;
      }

      if (!activeUsername) {
        return;
      }

      const token = getAccessToken(activeUsername);

      if (!token) {
        error(i18next.t("editor-toolbar.image-error-cache"));
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      void (async () => {
        for (const file of files) {
          try {
            const { url } = await uploadImage(file, token);
            setImage(url);
            setImageName(file.name);
            break;
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 413) {
              error(i18next.t("editor-toolbar.image-error-size"));
            } else {
              error(i18next.t("editor-toolbar.image-error"));
            }
            break;
          }
        }
      })();
    },
    [activeUsername, setImage, setImageName]
  );

  return (
    <div ref={rootRef} className="wave-form relative flex items-start px-4 pt-4 w-full">
      {!hideAvatar && activeUsername && (
        <UserAvatar
          username={activeUsername}
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
          <WaveFormThreadSelection host={threadHost} setHost={handleThreadHostChange} />
        )}
        <WaveFormControl
          video={video}
          text={text!!}
          setText={setText}
          textareaRef={textareaRef}
          selectedImage={image}
          clearSelectedImage={clearImage}
          placeholder={placeholder}
          characterLimit={characterLimit}
          onPasteImage={formInteractivityDisabled ? undefined : handlePasteImage}
          disabled={formInteractivityDisabled}
        />
        {isAccountLoading && (
          <div className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
            {i18next.t("g.loading")}...
          </div>
        )}
        {activeUsername && account && (
          <AvailableCredits username={activeUsername} operation="comment_operation" />
        )}

        <WaveFormToolbar
          isEdit={!!entry}
          disabled={formInteractivityDisabled}
          onAddImage={(url, name) => {
            setImage(url);
            setImageName(name);
          }}
          onEmojiPick={handleEmojiPick}
          onAddVideo={setVideo}
          submit={
            <Button
              onClick={() =>
                !submitDisabled &&
                submit({
                  text: text!!,
                  imageName: imageName!!,
                  image: image!!,
                  host: threadHost!!,
                  video: video!!
                })
              }
              disabled={submitDisabled}
              isLoading={isPending}
              className="justify-self-end"
              size="sm"
            >
              {!activeUsername &&
                !entry &&
                !exceedsCharacterLimit &&
                i18next.t("decks.threads-form.login-and-publish")}
              {activeUsername &&
                !replySource &&
                !entry &&
                !exceedsCharacterLimit &&
                (isPending
                  ? i18next.t("decks.threads-form.publishing")
                  : i18next.t("decks.threads-form.publish"))}
              {activeUsername &&
                replySource &&
                !entry &&
                !exceedsCharacterLimit &&
                (isPending ? i18next.t("waves.replying") : i18next.t("waves.reply"))}
              {exceedsCharacterLimit &&
                !entry &&
                !isReply &&
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
