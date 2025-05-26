import { Editor } from "@tiptap/core";

export interface ClipboardStrategy {
  handle(event: ClipboardEvent): void;
  withEditor(editor: Editor): this;
}
