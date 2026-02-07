import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
}

export function PublishEditorTableToolbar({ editor }: Props) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 w-full items-center p-2 flex flex-wrap gap-1">
      <span className="font-semibold text-sm opacity-50 px-2">Table</span>
      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        disabled={!editor.can().addColumnBefore()}
        className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add column before
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editor.can().addColumnAfter()}
        className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add column after
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        disabled={!editor.can().deleteColumn()}
        className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Delete column
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        disabled={!editor.can().addRowBefore()}
        className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add row before
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addRowAfter()}
        className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add row after
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteRow()}
        className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Delete row
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteTable().run()}
        disabled={!editor.can().deleteTable()}
        className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Delete table
      </button>
    </div>
  );
}
