import { error } from "@/features/shared";
import {
  HivePostExtension,
  SafeLink,
  Selection,
  TagMentionExtensionConfig,
  ThreeSpeakVideoExtension,
  YoutubeVideoExtension,
  UserMentionExtensionConfig,
  clipboardPlugin,
  markdownToHtml,
  parseAllExtensionsToDoc
} from "@/features/tiptap-editor";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import { AnyExtension, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useCallback, useEffect } from "react";
import { PublishEditorImageViewer } from "../_editor-extensions";
import { useEditorDragDrop } from "./use-editor-drag-drop";
import { usePublishState } from "./use-publish-state";
import { usePublishLinksAttach } from "./use-publish-links-attach";
import i18next from "i18next";

export function usePublishEditor(onHtmlPaste: () => void) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      handlePaste: ((_: any, event: ClipboardEvent, __: any) =>
        clipboardPlugin(event, editor, onHtmlPaste).handle(event)) as any
    },
    extensions: [
      StarterKit.configure() as AnyExtension,
      Placeholder.configure({
        placeholder: i18next.t("submit.body-placeholder")
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph", "youtubeVideo"]
      }),
      Selection,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        inline: true
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(PublishEditorImageViewer);
        }
      }),
      SafeLink,
      // User mention
      Mention.configure({
        HTMLAttributes: {
          class:
            "border border-[--border-color] rounded-lg px-1 py-0.5 bg-gray-100 dark:bg-dark-default text-blue-dark-sky"
        },
        suggestion: UserMentionExtensionConfig as any
      }),
      // Tags mention
      Mention.extend({
        name: "tag",
        priority: 102
      }).configure({
        HTMLAttributes: {
          class:
            "border border-[--border-color] rounded-lg px-1 py-0.5 bg-gray-100 dark:bg-dark-default text-blue-dark-sky"
        },
        suggestion: TagMentionExtensionConfig as any
      }),
      ThreeSpeakVideoExtension,
      YoutubeVideoExtension,
      HivePostExtension
    ],
    onUpdate({ editor }) {
      publishState.setContent(markdownToHtml(editor.getHTML()));
    }
  });

  usePublishLinksAttach(editor);
  useEditorDragDrop(editor);

  const publishState = usePublishState();

  const setEditorContent = useCallback(
    (content: string | undefined) => {
      try {
        const parsed = content ? marked.parse(content) : undefined;
        const sanitized =
          typeof parsed === "string" ? DOMPurify.sanitize(parsed) : undefined;
        const doc = sanitized
          ? parseAllExtensionsToDoc(sanitized, publishState.publishingVideo)
          : undefined;
        editor?.chain().setContent(doc ?? "").run();
      } catch (e) {
        error("Failed to load local draft. We are working on it");
        console.error(e);
        editor?.commands.setContent("");
      }
    },
    [editor, publishState.publishingVideo]
  );

  // Handle editor clearing
  useEffect(() => {
    if (!publishState.content && editor?.getText() !== "") {
      editor?.commands.setContent("");
    }
  }, [editor, publishState.content]);

  // Prefill editor with persistent content or default value
  useEffect(() => {
    if (editor) {
      setEditorContent(publishState.content);
    }
  }, [editor]);

  return { editor, setEditorContent };
}
