import { Editor } from "@tiptap/core";
import { ClipboardStrategy } from "./clipboard-strategy";

export class ClipboardPluginImageStrategy implements ClipboardStrategy {
  private editor: Editor | null = null;

  constructor() {}

  handle(event: ClipboardEvent): boolean | void {
    const allFiles = Array.from(event.clipboardData?.files ?? []);
    const chain = this.editor?.chain();

    allFiles
      .filter((file) => ["image/png", "image/jpeg", "image/jpg", "image/gif"].includes(file.type))
      .forEach(
        (file) =>
          chain?.insertContent([
            {
              type: "image",
              attrs: { alt: "", src: URL.createObjectURL(file) }
            },
            { type: "paragraph" },
            { type: "paragraph" }
          ])
      );

    chain?.run();

    event.preventDefault();
    return true;
  }

  withEditor(editor: Editor | null) {
    this.editor = editor;
    return this;
  }
}
