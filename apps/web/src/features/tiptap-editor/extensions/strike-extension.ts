import { mergeAttributes } from "@tiptap/core";
import Strike from "@tiptap/extension-strike";

export const DelStrike = Strike.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "del",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ];
  }
});
