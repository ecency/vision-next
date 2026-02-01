import { Editor, EditorContent } from "@tiptap/react";
import { motion } from "framer-motion";
import { usePublishState } from "../hooks/use-publish-state";
import { PublishEditorToolbar } from "./publish-editor-toolbar";
import { PublishTagsSelector } from "./publish-tags-selector";

interface Props {
  editor: Editor | null;
}

const MAX_TITLE_LENGTH = 255;

export function PublishEditor({ editor }: Props) {
  const { title, setTitleState, tags, setTagsState } = usePublishState();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-[1024px] rounded-2xl bg-white dark:bg-gray-800 container mx-auto px-2 py-4"
    >
      <input
        type="text"
        className="text-3xl w-full px-4 py-4 pb-3 bg-transparent outline-none font-serif text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitleState(e.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            editor?.commands.focus("start");
          }
        }}
      />
      <PublishTagsSelector tags={tags} onChange={setTagsState} />
      <div className="border-y border-gray-200 dark:border-gray-700 sticky top-[60px] md:top-[76px] -mx-2 z-10 bg-white dark:bg-gray-800">
        <PublishEditorToolbar editor={editor} />
      </div>
      <EditorContent
        editor={editor}
        className="markdown-body p-4 md:p-6 xl:p-8 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none"
      />
    </motion.div>
  );
}
