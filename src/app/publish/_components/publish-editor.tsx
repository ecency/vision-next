import { BubbleMenu, Editor, EditorContent } from "@tiptap/react";
import clsx from "clsx";
import { motion } from "framer-motion";
import i18next from "i18next";
import { PublishEditorPollEditor } from "../_editor-extensions";
import { usePublishState } from "../_hooks";
import { PublishEditorToolbar } from "./publish-editor-toolbar";
import { PublishEditorCounter } from "./publish-editor-counter";

interface Props {
  editor: Editor | null;
}

export function PublishEditor({ editor }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="publish-page max-w-[800px] rounded-2xl bg-white container mx-auto px-2"
    >
      <div className="publish-page-editor-toolbar-container border-b border-[--border-color] sticky top-[60px] md:top-[76px] -mx-2 rounded-t-2xl z-10 bg-white">
        <PublishEditorToolbar editor={editor} />
      </div>
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bubble-menu">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "is-active" : ""}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "is-active" : ""}
            >
              Italic
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "is-active" : ""}
            >
              Strike
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent
        editor={editor}
        className="markdown-view p-2 md:p-4 xl:p-6 font-serif caret-blue-dark-sky"
      />
      <PublishEditorCounter />
      <PublishEditorPollEditor />
    </motion.div>
  );
}
