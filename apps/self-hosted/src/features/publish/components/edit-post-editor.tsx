import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import { t } from "@/core";
import { htmlToMarkdown, markdownToHtml } from "../utils/markdown";
import { useUpdatePost } from "../hooks/use-update-post";
import { PublishEditorToolbar } from "./publish-editor-toolbar";
import { PublishTagsSelector } from "./publish-tags-selector";

const MAX_TITLE_LENGTH = 255;

interface Props {
  permlink: string;
  parentPermlink: string;
  initialTitle: string;
  initialBody: string;
  initialTags: string[];
}

export function EditPostEditor({
  permlink,
  parentPermlink,
  initialTitle,
  initialBody,
  initialTags,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [tags, setTags] = useState<string[]>(initialTags);

  const {
    mutateAsync: updatePost,
    isPending: isUpdating,
    error,
  } = useUpdatePost();

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: t("editor_start_writing") }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: true }),
    ],
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      setBody(markdown);
    },
  });

  // Load initial content into editor
  useEffect(() => {
    if (editor && initialBody) {
      try {
        const html = markdownToHtml(initialBody);
        editor.commands.setContent(html);
      } catch (e) {
        console.error("Failed to load content into editor:", e);
        editor.commands.setContent("");
      }
    }
  }, [editor, initialBody]);

  const canUpdate =
    title.trim().length > 0 && body.trim().length > 0 && tags.length > 0;

  const handleUpdate = useCallback(async () => {
    if (!canUpdate || isUpdating) return;

    try {
      await updatePost({
        permlink,
        parentPermlink,
        title,
        body,
        tags,
      });
    } catch (err) {
      console.error("Failed to update:", err);
    }
  }, [canUpdate, isUpdating, updatePost, permlink, parentPermlink, title, body, tags]);

  const handleTitleChange = useCallback(
    (value: string) => setTitle(value.slice(0, MAX_TITLE_LENGTH)),
    []
  );

  const handleTagsChange = useCallback(
    (value: string[]) => setTags(Array.from(new Set(value.filter((t) => t.trim())))),
    []
  );

  return (
    <>
      <div className="max-w-[1024px] mx-auto flex justify-between items-center">
        <Link
          search={{ filter: "posts" }}
          className="text-sm flex items-center gap-2 whitespace-nowrap"
          to="/blog"
        >
          <UilArrowLeft />
          {t("back_to_blog")}
        </Link>
        <motion.div
          initial={{ opacity: 0, y: -32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-2 md:px-4 py-4 flex justify-end"
        >
          <div className="flex flex-col items-end gap-2">
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded">
                {error.message}
              </div>
            )}
            <button
              type="button"
              onClick={handleUpdate}
              disabled={!canUpdate || isUpdating}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                canUpdate && !isUpdating
                  ? "bg-black hover:bg-black/80 text-white cursor-pointer"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isUpdating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("updating")}
                </span>
              ) : (
                t("update")
              )}
            </button>
          </div>
        </motion.div>
      </div>
      <div className="max-w-[1024px] w-full mx-auto px-2 md:px-4 py-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-[1024px] rounded-2xl bg-white dark:bg-gray-800 container mx-auto px-2 py-4"
        >
          <input
            type="text"
            className="text-3xl w-full px-3 py-4 pb-3 bg-transparent outline-none font-serif text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder={t("editor_post_title")}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editor?.commands.focus("start");
              }
            }}
          />
          <PublishTagsSelector tags={tags} onChange={handleTagsChange} />
          <div className="border-y border-gray-200 dark:border-gray-700 sticky top-[60px] md:top-[76px] z-10 bg-white dark:bg-gray-800">
            <PublishEditorToolbar editor={editor} />
          </div>
          <EditorContent
            editor={editor}
            className="markdown-body px-3 py-4 md:py-6 xl:py-8 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none"
          />
        </motion.div>
      </div>
    </>
  );
}
