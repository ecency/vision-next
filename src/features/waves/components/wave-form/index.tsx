import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import "./_index.scss";
import { Entry, WaveEntry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { PollsContext } from "@/features/polls";
import { useLocalStorage } from "react-use";
import { PREFIX } from "@/utils/local-storage";
import { useWaveCreate } from "@/features/waves/components/wave-form/api";
import { useWaveCreateReply } from "@/features/waves/components/wave-form/api/use-wave-create-reply";
import { AvailableCredits, UserAvatar } from "@/features/shared";
import { WaveFormThreadSelection } from "./wave-form-thread-selection";
import { WaveFormControl } from "./wave-form-control";
import i18next from "i18next";
import { Button } from "@ui/button";
import { WaveFormToolbar } from "@/features/waves/components/wave-form/wave-form-toolbar";

interface Props {
  className?: string;
  inline?: boolean;
  placeholder?: string;
  replySource?: Entry;
  onSuccess?: (reply: Entry) => void;
  hideAvatar?: boolean;
  entry: WaveEntry | undefined;
}

export const WaveForm = ({
  inline,
  placeholder,
  replySource,
  onSuccess,
  hideAvatar = false,
  entry
}: Props) => {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);
  const { clearActivePoll } = useContext(PollsContext);

  const [localDraft, setLocalDraft] = useLocalStorage<Record<string, any>>(
    PREFIX + "_local_draft",
    {}
  );
  const [threadHost, setThreadHost] = useLocalStorage(PREFIX + "_dtf_th", "ecency.waves");
  const [text, setText, clearText] = useLocalStorage(PREFIX + "_dtf_t", "");
  const [image, setImage, clearImage] = useLocalStorage<string>(PREFIX + "_dtf_i", "");
  const [imageName, setImageName, clearImageName] = useLocalStorage<string>(PREFIX + "_dtf_in", "");
  const [video, setVideo, clearVideo] = useLocalStorage<string>(PREFIX + "_dtf_v", "");

  const [loading, setLoading] = useState(false);

  const { mutateAsync: create } = useWaveCreate();
  const { mutateAsync: createReply } = useWaveCreateReply();

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

  const submit = useCallback(async () => {
    if (!activeUser) {
      toggleUIProp("login");
      return;
    }

    if (disabled) {
      return;
    }

    setLoading(true);
    try {
      let content = text!!;

      if (image) {
        content = `${content}<br>![${imageName ?? ""}](${image})`;
      }

      if (video) {
        content = `${content}<br>${video}`;
      }

      // Push to draft built content with attachments
      if (text!!.length > 255) {
        setLocalDraft({
          ...localDraft,
          body: content
        });
        window.open("/submit", "_blank");
        return;
      }

      let threadItem: WaveEntry;

      if (content === entry?.body) {
        return;
      }

      if (replySource) {
        threadItem = (await createReply({
          parent: replySource,
          raw: content,
          editingEntry: entry
        })) as WaveEntry;
      } else {
        threadItem = (await create({
          host: threadHost!!,
          raw: content,
          editingEntry: entry
        })) as WaveEntry;
      }

      if (threadHost) {
        threadItem.host = threadHost;
      }
      threadItem.id = threadItem.post_id;

      onSuccess?.(threadItem);
      clear();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    activeUser,
    clear,
    create,
    createReply,
    disabled,
    entry,
    image,
    imageName,
    localDraft,
    onSuccess,
    replySource,
    setLocalDraft,
    text,
    threadHost,
    toggleUIProp,
    video
  ]);

  return (
    <div className="flex items-start px-4 pt-4 w-full">
      {!hideAvatar && <UserAvatar username={activeUser?.username ?? ""} size="medium" />}
      <div className="pl-4 w-full">
        {!inline && <WaveFormThreadSelection host={threadHost} setHost={setThreadHost} />}
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
              onClick={submit}
              disabled={disabled}
              isLoading={loading}
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
                (loading
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
