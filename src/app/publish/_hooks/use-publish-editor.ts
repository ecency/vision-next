import { error } from "@/features/shared";
import Document from "@tiptap/extension-document";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Mention from "@tiptap/extension-mention";
import { AnyExtension, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Markdown } from "tiptap-markdown";
import { PublishEditorImageViewer } from "../_editor-extensions";
import { useEditorDragDrop } from "./use-editor-drag-drop";
import { usePublishState } from "./use-publish-state";
import { MentionExtensionConfig } from "@/features/tiptap-editor";

export const MENTION_PURE_REGEX =
  /@(?=[a-zA-Z][a-zA-Z0-9.-]{1,15}\b)[a-zA-Z][a-zA-Z0-9-]{2,}(?:\.[a-zA-Z][a-zA-Z0-9-]{2,})*\b/g;
export const MENTION_SPAN_REGEX = /<span[^>]*data-type="mention"[^>]*data-id="(.*)"*>.*<\/span>/g;

const CustomDocument = Document.extend({
  content: "heading block*"
});

export function usePublishEditor() {
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      CustomDocument,
      StarterKit.configure({
        document: false
      }) as AnyExtension,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "What’s the title?";
          } else if (node.type.name === "paragraph") {
            return "Tell your story...";
          }

          return "";
        }
      }),
      Markdown,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(PublishEditorImageViewer);
        }
      }),
      Link.configure({
        openOnClick: false
      }),
      Mention.configure({
        HTMLAttributes: {
          class:
            "border border-[--border-color] rounded-lg px-1 py-0.5 bg-gray-100 dark:bg-dark-default text-blue-dark-sky"
        },
        suggestion: MentionExtensionConfig as any
      })
    ],
    onUpdate({ editor }) {
      const markdown = editor.storage.markdown.getMarkdown();
      const title = markdown.substring(0, markdown.indexOf("\n"));
      const content = markdown.substring(markdown.indexOf("\n"));

      publishState.setTitle(title.replace("# ", ""));
      publishState.setContent(
        content.replace(MENTION_SPAN_REGEX, (match: string) => {
          const el = document.createElement("span");
          el.innerHTML = match;
          return "@" + (el.firstChild as HTMLElement)?.dataset["id"];
        })
      );
    }
  });

  useEditorDragDrop(editor);

  const publishState = usePublishState();

  // Handle editor clearing
  useEffect(() => {
    if (
      !publishState.title &&
      !publishState.content &&
      editor?.storage.markdown.getMarkdown() !== ""
    ) {
      editor?.chain().setContent("").run();
    }
  }, [editor, publishState.title, publishState.content]);

  // Prefill editor with persistent content or default value
  useEffect(() => {
    try {
      editor
        ?.chain()
        .setContent(
          `${publishState.title ?? "# Hello Ecency member,"}\n\n ${
            publishState.content?.replace(
              MENTION_PURE_REGEX,
              (match) => `<span data-type="mention" data-id=${match.replace("@", "")} />`
            ) ?? "Tell your story..."
          }`
        )
        .run();
    } catch (e) {
      error("Failed to laod local draft. We are working on it");
      throw e;
    }
  }, [editor]);

  return editor;
}
