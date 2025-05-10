import { error } from "@/features/shared";
import {
  Selection,
  TagMentionExtensionConfig,
  ThreeSpeakVideoExtension,
  UserMentionExtensionConfig,
  parseAllExtensionsToDoc
} from "@/features/tiptap-editor";
import Document from "@tiptap/extension-document";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { AnyExtension, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { PublishEditorImageViewer } from "../_editor-extensions";
import { useEditorDragDrop } from "./use-editor-drag-drop";
import { usePublishState } from "./use-publish-state";
import Turndown from "turndown";
// @ts-ignore
import { strikethrough } from "@joplin/turndown-plugin-gfm";

const CustomDocument = Document.extend({
  content: "heading block*"
});

export function usePublishEditor() {
  const editor = useEditor({
    immediatelyRender: false,
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
      Link.configure({
        openOnClick: false
      }),
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
      ThreeSpeakVideoExtension
    ],
    onUpdate({ editor }) {
      const text = new Turndown({
        codeBlockStyle: "fenced"
      })
        .use(strikethrough)
        .keep(["table", "tbody", "th", "tr", "td"])
        .turndown(editor.getHTML());
      const title = text.substring(0, text.indexOf("\n"));
      const content = text.substring(text.indexOf("\n")).replace("======", "");

      publishState.setTitle(title.replace("# ", ""));
      publishState.setContent(content);
    }
  });

  useEditorDragDrop(editor);

  const publishState = usePublishState();

  const setEditorContent = useCallback(
    (title: string | undefined, content: string | undefined) => {
      try {
        const sanitizedContent = content
          ? parseAllExtensionsToDoc(DOMPurify.sanitize(marked.parse(content) as string))
          : undefined;
        editor
          ?.chain()
          .setContent(
            `${title ?? "# Hello Ecency member,"}\n\n ${sanitizedContent ?? "Tell your story..."}`
          )
          .run();
      } catch (e) {
        error("Failed to laod local draft. We are working on it");
        throw e;
      }
    },
    [editor]
  );

  // Handle editor clearing
  useEffect(() => {
    if (!publishState.title && !publishState.content && editor?.getText() !== "") {
      editor?.chain().setContent("").run();
    }
  }, [editor, publishState.title, publishState.content]);

  // Prefill editor with persistent content or default value
  useEffect(() => {
    setEditorContent(publishState.title, publishState.content);
  }, [setEditorContent]);

  return { editor, setEditorContent };
}
