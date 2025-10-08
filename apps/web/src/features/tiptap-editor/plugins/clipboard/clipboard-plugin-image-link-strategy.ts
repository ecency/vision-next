import { Editor } from "@tiptap/core";
import { ClipboardStrategy } from "./clipboard-strategy";

export class ClipboardPluginImageLinkStrategy implements ClipboardStrategy {
  private editor: Editor | null = null;

  handle(event: ClipboardEvent): boolean | void {
    const uri = event.clipboardData!.getData("text/plain");
    const url = new URL(uri);
    if (
      url.pathname.endsWith("jpg") ||
      url.pathname.endsWith("png") ||
      url.pathname.endsWith("jpeg")
    ) {
      this.editor
        ?.chain()
        .insertContent([
          {
            type: "image",
            attrs: {
              src: uri,
              alt: uri
            }
          },
          { type: "paragraph" },
          { type: "paragraph" }
        ])
        .run();

      event.preventDefault();
      return true;
    }
  }

  withEditor(editor: Editor | null) {
    this.editor = editor;
    return this;
  }
}
