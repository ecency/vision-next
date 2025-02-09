"use client";

import { AnyExtension, EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import "./page.scss";
import { StarterKit } from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

import { usePublishState } from "@/app/publish/_hooks";
import { useEffect } from "react";
import { PublishEditorToolbar } from "@/app/publish/_components";
import { Markdown } from "tiptap-markdown";
import { PublishEditorImageViewer } from "./_editor-extensions";

const CustomDocument = Document.extend({
  content: "heading block*"
});

export default function PublishPage() {
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
      publishState.setTitle(title);
      publishState.setContent(content);
    }
  });

  const publishState = usePublishState();

  useEffect(() => {
    editor
      ?.chain()
      .setContent(
        `${publishState.title ?? "# Hello Ecency member,"}\n\n ${
          publishState.content ?? "Tell your story..."
        }`
      )
      .run();
  }, [editor]);

  return (
    <div className="publish-page max-w-[800px] rounded-2xl bg-white container mx-auto px-2">
      <div className="publish-page-editor-toolbar-container border-b border-[--border-color] sticky top-[60px] md:top-[76px] -mx-2 rounded-t-2xl z-10 bg-white">
        <PublishEditorToolbar editor={editor} />
      </div>
      <EditorContent editor={editor} className="markdown-view p-2 md:p-4 xl:p-6 font-serif" />
    </div>
  );
}
