"use client";

import defaults from "@/defaults";
import { Entry } from "@/entities";
import { AvailableCredits, handleAndReportError, LoginRequired } from "@/features/shared";
import { CommentPreview } from "@/features/shared/comment/comment-preview";
import { detectEvent, EditorToolbar, toolbarEventListener } from "@/features/shared/editor-toolbar";
import { TextareaAutocomplete } from "@/features/shared/textarea-autocomplete";
import { PREFIX } from "@/utils/local-storage";
import { setProxyBase } from "@ecency/render-helper";
import { Button } from "@ui/button";
import i18next from "i18next";
import React, {
  Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useDebounce, useMount } from "react-use";
import useLocalStorage from "react-use/lib/useLocalStorage";
import useUnmount from "react-use/lib/useUnmount";
import "./_index.scss";
import { useClientActiveUser } from "@/api/queries";
import { useQuery } from "@tanstack/react-query";
import {
  getCommunityContextQueryOptions,
  getCommunityPermissions,
  getCommunityType
} from "@ecency/sdk";
import { isCommunity } from "@/utils";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";

setProxyBase(defaults.imageServer);

interface Props {
  submitText: string;
  entry: Entry;
  inProgress?: boolean;
  isCommented?: boolean;
  cancellable?: boolean;
  autoFocus?: boolean;
  onSubmit: (text: string) => Promise<any>;
  onCancel?: () => void;
  inputRef?: Ref<HTMLTextAreaElement>;
  clearOnSubmit?: boolean;
  isEdit?: boolean;
}

export function Comment({
  entry,
  onSubmit,
  onCancel,
  cancellable,
  submitText,
  inputRef,
  inProgress,
  autoFocus,
  isEdit,
  clearOnSubmit = true
}: Props) {
  const commentBodyRef = useRef<HTMLDivElement>(null);
  const activeUser = useClientActiveUser();
  const { selection, setSelection } = useContext(EntryPageContext);

  const [text, setText] = useLocalStorage(
    PREFIX + `_reply_text_${entry.author}_${entry.permlink}`,
    ""
  );
  const [inputHeight, setInputHeight] = useState(0);
  const [preview, setPreview] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);

  const { data: userContext } = useQuery({
    ...getCommunityContextQueryOptions(activeUser?.username, entry.category),
    enabled: !!activeUser?.username && isCommunity(entry.category),
    select: ({ subscribed, role }) =>
      getCommunityPermissions({
        communityType: getCommunityType(entry.category ?? "", -1),
        subscribed,
        userRole: role
      })
  });

  const rows = useMemo(() => text!.split(/\r\n|\r|\n|<br>/).length, [text]);

  useEffect(() => {
    if (selection) {
      setText((prev) => `${selection}${prev ?? ""}`);
      const el = (inputRef as any)?.current as HTMLTextAreaElement | null;

      // Enhanced validation to ensure element is fully initialized
      if (el && el.scrollHeight !== undefined && typeof el.scrollHeight === 'number') {
        try {
          // Safely access DOM properties with additional validation
          let scHeight = el.scrollHeight;
          const reduceScHeight = scHeight - 20 || scHeight - 24;
          if (reduceScHeight) {
            scHeight = reduceScHeight;
          }
          setInputHeight(scHeight);
          const caret = selection.length;

          // Re-validate element existence and method availability in requestAnimationFrame
          requestAnimationFrame(() => {
            const currentEl = (inputRef as any)?.current as HTMLTextAreaElement | null;
            if (currentEl &&
                typeof currentEl.setSelectionRange === 'function' &&
                currentEl.isConnected) {
              currentEl.setSelectionRange(caret, caret);
            }
          });
        } catch (error) {
          // Gracefully handle any DOM access errors during hydration
          console.debug('Error accessing textarea during hydration:', error);
        }
      }
      setSelection("");
    }
  }, [selection, setSelection, setText, inputRef]);

  useDebounce(
    () => {
      setPreview(text!);
    },
    50,
    [text]
  );

  useMount(() => {
    if (isEdit) {
      setText(entry.body);
    }

    commentBodyRef.current?.addEventListener("paste", handlePaste);
    commentBodyRef.current?.addEventListener("dragover", handleDragover);
    commentBodyRef.current?.addEventListener("drop", handleDrop);
  });

  useUnmount(() => {
    commentBodyRef.current?.removeEventListener("paste", handlePaste);
    commentBodyRef.current?.removeEventListener("dragover", handleDragover);
    commentBodyRef.current?.removeEventListener("drop", handleDrop);
  });

    const textChanged = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      const { value: text } = e.target;
      let scHeight: number = e.target.scrollHeight;
      let reduceScHeight: number = scHeight - 20 || scHeight - 24;
      if (reduceScHeight) {
        scHeight = reduceScHeight;
      }
      setText(text);
      setInputHeight(scHeight);
    }, [setText]);

    const submit = useCallback(async () => {
      try {
        await onSubmit(text!);
        if (clearOnSubmit) {
          setText("");
        }
      } catch (err: any) {
        const handled = handleAndReportError(err, "comment");
        if (!handled) {
          throw err; // ❌ only throw unexpected errors
        }
      }
    }, [onSubmit, text, clearOnSubmit, setText]);

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
  const isCommunityPost = isCommunity(entry.category);
  const canComment = isCommunityPost
      ? userContext?.canComment
      : !!activeUser?.username;

  if (!canComment) {
    return <></>;
  }

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
