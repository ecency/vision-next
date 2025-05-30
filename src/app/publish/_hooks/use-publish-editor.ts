import { error } from "@/features/shared";
import {
  HivePostExtension,
  SafeLink,
  Selection,
  TagMentionExtensionConfig,
  ThreeSpeakVideoExtension,
  UserMentionExtensionConfig,
  clipboardPlugin,
  markdownToHtml,
  parseAllExtensionsToDoc
} from "@/features/tiptap-editor";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { AnyExtension, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useCallback, useEffect } from "react";
import { PublishEditorImageViewer } from "../_editor-extensions";
import { useEditorDragDrop } from "./use-editor-drag-drop";
import { usePublishState } from "./use-publish-state";
import { usePublishLinksAttach } from "./use-publish-links-attach";

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
        placeholder: "Tell your story.."
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"]
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
        const sanitizedContent = content
          ? parseAllExtensionsToDoc(
              DOMPurify.sanitize(marked.parse(content) as string),
              publishState.publishingVideo
            )
          : undefined;
        editor
          ?.chain()
          .setContent(sanitizedContent ?? "")
          .run();
      } catch (e) {
        error("Failed to laod local draft. We are working on it");
        throw e;
      }
    },
    [editor, publishState.publishingVideo]
  );

  // Handle editor clearing
  useEffect(() => {
    if (!publishState.content && editor?.getText() !== "") {
      editor?.chain().setContent("").run();
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
