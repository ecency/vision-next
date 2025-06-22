import { Editor } from "@tiptap/core";
import { ClipboardStrategy } from "./clipboard-strategy";
import { parseAllExtensionsToDoc } from "../../functions";
import DOMPurify from "dompurify";
import { marked } from "marked";

export class ClipboardPluginTextStrategy implements ClipboardStrategy {
  private editor: Editor | null = null;
  private onHtmlPaste: () => void;

  constructor(onHtmlPaste: () => void) {
    this.onHtmlPaste = onHtmlPaste;
  }

  handle(event: ClipboardEvent): boolean | void {
    const pastedText = event.clipboardData?.getData("text/plain");
    if (pastedText) {
      if (/<[a-z]+>.*<\/[a-z]+>/gim.test(pastedText)) {
        this.onHtmlPaste();
      } else {
        const parsedText = parseAllExtensionsToDoc(
          DOMPurify.sanitize(marked.parse(pastedText) as string)
        );

        this.editor?.chain().insertContent(parsedText).run();
      }

      event.preventDefault();
      return true;
    }
  }

  withEditor(editor: Editor | null) {
    this.editor = editor;
    return this;
  }
}
