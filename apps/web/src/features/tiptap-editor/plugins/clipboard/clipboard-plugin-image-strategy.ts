import { Editor } from "@tiptap/core";
import { ClipboardStrategy } from "./clipboard-strategy";

export class ClipboardPluginImageStrategy implements ClipboardStrategy {
  private editor: Editor | null = null;
  private createdBlobUrls: Set<string> = new Set();

  constructor() {}

  handle(event: ClipboardEvent): boolean | void {
    const allFiles = Array.from(event.clipboardData?.files ?? []);
    const chain = this.editor?.chain();

    allFiles
      .filter((file) => ["image/png", "image/jpeg", "image/jpg", "image/gif"].includes(file.type))
      .forEach((file) => {
        // TODO: Ideally, pasted images should be uploaded to the server immediately
        // and the blob URL should be replaced with the server URL to avoid memory leaks
        // and ensure images persist if the user navigates away and returns.
        const blobUrl = URL.createObjectURL(file);
        this.createdBlobUrls.add(blobUrl);

        chain?.insertContent([
          {
            type: "image",
            attrs: { alt: "", src: blobUrl }
          },
          { type: "paragraph" },
          { type: "paragraph" }
        ]);
      });

    chain?.run();

    event.preventDefault();
    return true;
  }

  withEditor(editor: Editor | null) {
    this.editor = editor;
    return this;
  }

  /**
   * Clean up all blob URLs created by this strategy.
   * Should be called when the editor is destroyed or the component unmounts.
   */
  destroy() {
    this.createdBlobUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.createdBlobUrls.clear();
  }
}
