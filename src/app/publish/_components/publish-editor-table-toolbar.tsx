import { Button, StyledTooltip } from "@/features/ui";
import { UilArrowLeft, UilArrowRight, UilBold } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

interface Props {
  editor: any | null;
}

export function PublishEditorTableToolbar({ editor }: Props) {
  return (
    <div className=" border-t border-[--border-color] bg-gray-100 dark:bg-gray-800 w-full items-center p-2 sm:py-0 flex flex-wrap gap-1 sm:gap-0">
      <span className="font-semibold text-sm opacity-50 px-2">{i18next.t("publish.table")}</span>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        disabled={!editor.can().addColumnBefore()}
      >
        Add column before
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editor.can().addColumnAfter()}
      >
        Add column after
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        disabled={!editor.can().deleteColumn()}
      >
        Delete column
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        disabled={!editor.can().addRowBefore()}
      >
        Add row before
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addRowAfter()}
      >
        Add row after
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteRow()}
      >
        Delete row
      </Button>

      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().deleteTable().run()}
        disabled={!editor.can().deleteTable()}
      >
        Delete table
      </Button>
    </div>
  );
}
