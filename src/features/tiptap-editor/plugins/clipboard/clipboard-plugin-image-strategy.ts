import { Editor } from "@tiptap/core";
import { ClipboardStrategy } from "./clipboard-strategy";

export class ClipboardPluginImageStrategy implements ClipboardStrategy {
  private editor: Editor | null = null;

  constructor() {}

  handle(event: ClipboardEvent) {
    const allFiles = Array.from(event.clipboardData?.files ?? []);
    const chain = this.editor?.chain();

    allFiles
      .filter((file) => ["image/png", "image/jpeg"].includes(file.type))
      .forEach(
        (file) =>
          chain?.setImage({
            alt: file.name,
            src: URL.createObjectURL(file)
          })
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
