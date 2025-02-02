"use client";

import { AnyExtension, EditorContent, useEditor } from "@tiptap/react";
import "./page.scss";
import { StarterKit } from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Document from "@tiptap/extension-document";
import Placeholder from "@tiptap/extension-placeholder";
import { usePublishState } from "@/app/publish/_hooks";
import { useEffect } from "react";
import { markdown2Html } from "@ecency/render-helper/lib/markdown-2-html";
import { PublishEditorToolbar } from "@/app/publish/_components";

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
          }

          return "Tell your story...";
        }
      }),
      Highlight,
      Typography
    ]
  });

  const publishState = usePublishState();

  useEffect(() => {
    editor?.commands.setContent(
      markdown2Html("# Hello **eccencial**,\n\nWrite your story..."),
      true
    );
  }, [editor]);

  return (
    <div className="publish-page max-w-[800px] rounded-2xl bg-white container mx-auto">
      <div className="border-b border-[--border-color]">
        {editor && <PublishEditorToolbar editor={editor} />}
      </div>
      <EditorContent editor={editor} className="markdown-view p-2 md:p-4 xl:p-6 font-serif" />
    </div>
  );
}
