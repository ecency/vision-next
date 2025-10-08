import { Editor } from "@tiptap/core";

export interface ClipboardStrategy {
  handle(event: ClipboardEvent): void | boolean;
  withEditor(editor: Editor | null): this;
}
