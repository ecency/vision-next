import { Editor } from "@tiptap/core";
import { ClipboardPluginTextStrategy } from "./clipboard-plugin-text-strategy";
import { ClipboardPluginImageStrategy } from "./clipboard-plugin-image-strategy";
import { ClipboardPluginImageLinkStrategy } from "./clipboard-plugin-image-link-strategy";

export function clipboardPlugin(
  event: ClipboardEvent,
  editor: Editor | null,
  onHtmlPaste: () => void
) {
  const hasFile = Array.from(event.clipboardData?.files ?? []).length > 0;
  let isImageLink = false;

  try {
    new URL(event.clipboardData!.getData("text/plain"));
    isImageLink = true;
  } catch (e) {}

  if (hasFile) {
    return new ClipboardPluginImageStrategy().withEditor(editor);
  } else if (isImageLink) {
    return new ClipboardPluginImageLinkStrategy().withEditor(editor);
  }

  return new ClipboardPluginTextStrategy(onHtmlPaste).withEditor(editor);
}
