import { Editor, EditorContent } from "@tiptap/react";
import { motion } from "framer-motion";
import { PublishEditorPollEditor } from "../_editor-extensions";
import { PublishEditorCounter } from "./publish-editor-counter";
import { PublishEditorToolbar } from "./publish-editor-toolbar";

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
      <EditorContent
        editor={editor}
        className="markdown-view p-2 md:p-4 xl:p-6 font-serif caret-blue-dark-sky"
      />
      <PublishEditorCounter />
      <PublishEditorPollEditor />
    </motion.div>
  );
}
