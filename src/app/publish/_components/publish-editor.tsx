import { BubbleMenu } from "@/features/tiptap-editor";
import { Editor, EditorContent } from "@tiptap/react";
import { motion } from "framer-motion";
import i18next from "i18next";
import TextareaAutosize from "react-textarea-autosize";
import { SUBMIT_TITLE_MAX_LENGTH } from "@/app/submit/_consts";
import { PublishEditorPollEditor } from "../_editor-extensions";
import { usePublishState } from "../_hooks";
import { PublishEditorCounter } from "./publish-editor-counter";
import { PublishEditorToolbar } from "./publish-editor-toolbar";

interface Props {
  editor: Editor | null;
}

export function PublishEditor({ editor }: Props) {
  const { title, setTitle } = usePublishState();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="publish-page max-w-[1024px] rounded-2xl bg-white container mx-auto px-2"
    >
      <TextareaAutosize
        className="text-xl w-full px-4 py-4 pb-3 bg-transparent outline-none font-serif resize-none"
        placeholder={i18next.t("publish.title-placeholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={SUBMIT_TITLE_MAX_LENGTH}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            editor?.commands.focus("start");
          }
        }}
      />
      <div className="publish-page-editor-toolbar-container border-y border-[--border-color] sticky top-[60px] md:top-[76px] -mx-2 z-10 bg-white">
        <PublishEditorToolbar editor={editor} />
      </div>
      <EditorContent
        editor={editor}
        className="markdown-view p-2 md:p-4 xl:p-6 font-serif caret-blue-dark-sky"
      />
      <BubbleMenu editor={editor} />

      <PublishEditorCounter />
      <PublishEditorPollEditor />
    </motion.div>
  );
}
