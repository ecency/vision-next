import { Editor } from "@tiptap/core";
import { ClipboardPluginTextStrategy } from "./clipboard-plugin-text-strategy";
import { ClipboardPluginImageStrategy } from "./clipboard-plugin-image-strategy";

export function clipboardPlugin(
  event: ClipboardEvent,
  editor: Editor | null,
  onHtmlPaste: () => void
) {
  const hasFile = Array.from(event.clipboardData?.files ?? []).length > 0;
  if (hasFile) {
    return new ClipboardPluginImageStrategy().withEditor(editor);
  }

  return new ClipboardPluginTextStrategy(onHtmlPaste).withEditor(editor);
}
