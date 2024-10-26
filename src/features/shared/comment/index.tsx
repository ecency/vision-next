"use client";

import React, { Ref, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { Button } from "@ui/button";
import defaults from "@/defaults.json";
import { AvailableCredits, LoginRequired } from "@/features/shared";
import { CommentPreview } from "@/features/shared/comment/comment-preview";
import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import * as ss from "@/utils/session-storage";
import { Entry } from "@/entities";
import { useDebounce, useMount } from "react-use";
import useUnmount from "react-use/lib/useUnmount";
import { detectEvent, EditorToolbar, toolbarEventListener } from "@/features/shared/editor-toolbar";
import { TextareaAutocomplete } from "@/features/shared/textarea-autocomplete";
import usePrevious from "react-use/lib/usePrevious";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";

setProxyBase(defaults.imageServer);

interface Props {
  defText: string;
  submitText: string;
  entry: Entry;
  inProgress?: boolean;
  isCommented?: boolean;
  cancellable?: boolean;
  autoFocus?: boolean;
  onSubmit: (text: string) => Promise<any>;
  resetSelection?: () => void;
  onCancel?: () => void;
  inputRef?: Ref<any>;
  clearOnSubmit?: boolean;
}

export function Comment({
  entry,
  onSubmit,
  onCancel,
  isCommented,
  cancellable,
  submitText,
  defText,
  resetSelection,
  inputRef,
  inProgress,
  autoFocus,
  clearOnSubmit = true
}: Props) {
  const commentBodyRef = useRef<HTMLDivElement>(null);
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [text, setText] = useLocalStorage(PREFIX + "_c_t", "");
  const [inputHeight, setInputHeight] = useState(0);
  const [preview, setPreview] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);

  const previousDefText = usePrevious(defText);
  const previousIsCommented = usePrevious(isCommented);

  const rows = useMemo(() => text!.split(/\r\n|\r|\n|<br>/).length, [text]);

  useDebounce(
    () => {
      setPreview(text!);
    },
    50,
    [text]
  );

  useMount(() => {
    setText(defText);
    setPreview("");

    commentBodyRef.current?.addEventListener("paste", handlePaste);
    commentBodyRef.current?.addEventListener("dragover", handleDragover);
    commentBodyRef.current?.addEventListener("drop", handleDrop);
  });

  useUnmount(() => {
    commentBodyRef.current?.removeEventListener("paste", handlePaste);
    commentBodyRef.current?.removeEventListener("dragover", handleDragover);
    commentBodyRef.current?.removeEventListener("drop", handleDrop);
  });

  const updateLsCommentDraft = useCallback(
    (text: string) => {
      ss.set(`reply_draft_${entry.author}_${entry.permlink}`, text);
    },
    [entry]
  );

  const textChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value: text } = e.target;
    let scHeight: number = e.target.scrollHeight;
    let reduceScHeight: number = scHeight - 20 || scHeight - 24;
    if (reduceScHeight) {
      scHeight = reduceScHeight;
    }
    setText(text);
    setInputHeight(scHeight);
  }, []);

  const submit = useCallback(async () => {
    await onSubmit(text!);
    if (clearOnSubmit) {
      setText("");
    }
  }, [onSubmit, text, clearOnSubmit]);

  const cancel = useCallback(() => {
    if (onCancel) onCancel();
  }, [onCancel]);

  const handlePaste = (event: Event): void => toolbarEventListener(event, "paste");

  const handleDragover = (event: Event): void => toolbarEventListener(event, "dragover");

  const handleDrop = (event: Event): void => toolbarEventListener(event, "drop");
  const handleShortcuts = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey && e.key === "b") {
      detectEvent("bold");
    }
    if (e.altKey && e.key === "i") {
      detectEvent("italic");
    }
    if (e.altKey && e.key === "t") {
      detectEvent("table");
    }
    if (e.altKey && e.key === "k") {
      detectEvent("link");
    }
    if (e.altKey && e.key === "c") {
      detectEvent("codeBlock");
    }
    if (e.altKey && e.key === "d") {
      detectEvent("image");
    }
    if (e.altKey && e.key === "m") {
      detectEvent("blockquote");
    }
  };

  useEffect(() => {
    if (defText !== previousDefText && !previousDefText) {
      let commentText = defText;
      setText(commentText || "");
      setPreview(commentText || "");
      if (resetSelection) resetSelection();
      updateLsCommentDraft(commentText);
    }
    if (!previousIsCommented && isCommented) {
      setText("");
      setPreview("");
      updateLsCommentDraft("");
    }
  }, [
    defText,
    isCommented,
    previousDefText,
    previousIsCommented,
    resetSelection,
    text,
    updateLsCommentDraft
  ]);

  return (
    <>
      <div
        className="comment-box"
        onMouseEnter={() => {
          if (!showEmoji && !showGif) {
            setShowEmoji(true);
            setShowGif(true);
          }
        }}
      >
        <EditorToolbar comment={true} sm={true} />
        <div className="comment-body" onKeyDown={handleShortcuts} ref={commentBodyRef}>
          <TextareaAutocomplete
            className={`the-editor accepts-emoji ${text!.length > 20 ? "expanded" : ""}`}
            as="textarea"
            placeholder={i18next.t("comment.body-placeholder")}
            containerStyle={{ height: !text ? "80px" : inputHeight }}
            value={text}
            onChange={textChanged}
            disabled={inProgress}
            autoFocus={autoFocus}
            minrows={10}
            rows={rows}
            maxrows={100}
            ref={inputRef}
            acceptCharset="UTF-8"
            id="the-editor"
            spellCheck={true}
            isComment={true}
          />
          <div className="editor-toolbar bottom">
            {activeUser ? (
              <AvailableCredits
                className="p-2 w-full"
                operation="comment_operation"
                username={activeUser.username}
              />
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className="comment-buttons flex items-center mt-3">
          {cancellable && (
            <Button
              className="mr-2"
              size="sm"
              outline={true}
              disabled={inProgress}
              onClick={cancel}
            >
              {i18next.t("g.cancel")}
            </Button>
          )}
          <LoginRequired>
            <Button size="sm" onClick={submit} isLoading={inProgress} iconPlacement="left">
              {submitText}
            </Button>
          </LoginRequired>
        </div>
        <CommentPreview text={preview} />
      </div>
    </>
  );
}
