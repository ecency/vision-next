import { mergeAttributes } from "@tiptap/core";
import Link, { isAllowedUri } from "@tiptap/extension-link";

/**
 * Inspired by https://www.tiptap.dev/api/marks/link
 * This extensions emulates link behavior to keep Hive Keychain extension outside of editor
 */
export const SafeLink = Link.configure({
  openOnClick: false
}).extend({
  renderHTML({ HTMLAttributes }) {
    // prevent XSS attacks
    if (
      !this.options.isAllowedUri(HTMLAttributes.href, {
        defaultValidate: (href) => !!isAllowedUri(href, this.options.protocols),
        protocols: this.options.protocols,
        defaultProtocol: this.options.defaultProtocol
      })
    ) {
      // strip out the href
      return [
        "a",
        mergeAttributes(this.options.HTMLAttributes, {
          ...HTMLAttributes,
          href: "",
          class: "editor-link keychainify-checked"
        }),
        0
      ];
    }

    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, {
        ...HTMLAttributes,
        class: "editor-link keychainify-checked"
      }),
      0
    ];
  }
});
