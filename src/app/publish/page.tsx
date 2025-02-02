"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import "./page.scss";
import { StarterKit } from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { useEffect } from "react";
import { markdown2Html } from "@ecency/render-helper/lib/markdown-2-html";
import { usePublishState } from "@/app/publish/_hooks";
import { PublishTagSelector, PublishTitleControl } from "@/app/publish/_components";

export default function PublishPage() {
  const editor = useEditor({
    extensions: [StarterKit as any, Highlight, Typography]
  });

  const publishState = usePublishState();

  useEffect(() => {
    editor?.commands.setContent(
      markdown2Html("# Hello **eccencial**,\n\nWrite your story..."),
      true
    );
  }, [editor]);

  return (
    <div className="publish-page rounded-2xl bg-white container mx-auto">
      <div className="border-b border-[--border-color] p-2 md:p-4 xl:p-6">
        <PublishTitleControl />
      </div>
      <div className="border-b border-[--border-color] p-2 md:p-4 xl:p-6">
        <PublishTagSelector />
      </div>
      <EditorContent editor={editor} className="markdown-view p-2 md:p-4 xl:p-6 font-serif" />
    </div>
  );
}
