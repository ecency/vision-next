import { error } from "@/features/shared";
import {
  HivePostExtension,
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
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useCallback, useEffect } from "react";
import Turndown from "turndown";
import { PublishEditorImageViewer } from "../_editor-extensions";
import { useEditorDragDrop } from "./use-editor-drag-drop";
import { usePublishState } from "./use-publish-state";
// @ts-ignore
import { strikethrough } from "@joplin/turndown-plugin-gfm";
import { usePublishLinksAttach } from "./use-publish-links-attach";

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
      ThreeSpeakVideoExtension,
      HivePostExtension
    ],
    onUpdate({ editor }) {
      const text = new Turndown({
        codeBlockStyle: "fenced"
      })
        .use(strikethrough)
        .keep(["table", "tbody", "th", "tr", "td"])
        .turndown(editor.getHTML());
      const title = text.substring(0, text.indexOf("\n"));
      const content = text.substring(text.indexOf("\n"));

      publishState.setTitle(title.replace("# ", ""));
      publishState.setContent(content.substring(text.indexOf("\n") + 1));
    }
  });

  usePublishLinksAttach(editor);
  useEditorDragDrop(editor);

  const publishState = usePublishState();

  const setEditorContent = useCallback(
    (title: string | undefined, content: string | undefined) => {
      try {
        const sanitizedContent = content
          ? parseAllExtensionsToDoc(
              DOMPurify.sanitize(marked.parse(content) as string),
              publishState.publishingVideo
            )
          : undefined;
        editor
          ?.chain()
          .setContent(`${title ?? ""}\n\n ${sanitizedContent ?? ""}`)
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
    if (!publishState.title && !publishState.content && editor?.getText() !== "") {
      editor?.chain().setContent("").run();
    }
  }, [editor, publishState.title, publishState.content]);

  // Prefill editor with persistent content or default value
  useEffect(() => {
    if (editor) {
      setEditorContent(publishState.title, publishState.content);
    }
  }, [editor]);

  return { editor, setEditorContent };
}
