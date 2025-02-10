import { AnyExtension, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import StarterKit from "@tiptap/starter-kit";
import { PublishEditorImageViewer } from "../_editor-extensions";
import { usePublishState } from "./use-publish-state";
import { useEffect } from "react";
import { error } from "@/features/shared";

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
      })
    ],
    onUpdate({ editor }) {
      const markdown = editor.storage.markdown.getMarkdown();
      const title = markdown.substring(0, markdown.indexOf("\n"));
      const content = markdown.substring(markdown.indexOf("\n"));
      publishState.setTitle(title.replace("# ", ""));
      publishState.setContent(content);
    }
  });

  const publishState = usePublishState();

  useEffect(() => {
    try {
      editor
        ?.chain()
        .setContent(
          `${publishState.title ?? "# Hello Ecency member,"}\n\n ${
            publishState.content ?? "Tell your story..."
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
