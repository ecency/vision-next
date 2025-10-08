import { Button } from "@/features/ui";
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
        {i18next.t("publish.table-toolbar.add-column-before")}
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editor.can().addColumnAfter()}
      >
        {i18next.t("publish.table-toolbar.add-column-after")}
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        disabled={!editor.can().deleteColumn()}
      >
        {i18next.t("publish.table-toolbar.delete-column")}
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        disabled={!editor.can().addRowBefore()}
      >
        {i18next.t("publish.table-toolbar.add-row-before")}
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addRowAfter()}
      >
        {i18next.t("publish.table-toolbar.add-row-after")}
      </Button>
      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteRow()}
      >
        {i18next.t("publish.table-toolbar.delete-row")}
      </Button>

      <Button
        appearance="gray-link"
        size="sm"
        onClick={() => editor.chain().focus().deleteTable().run()}
        disabled={!editor.can().deleteTable()}
      >
        {i18next.t("publish.table-toolbar.delete-table")}
      </Button>
    </div>
  );
}
