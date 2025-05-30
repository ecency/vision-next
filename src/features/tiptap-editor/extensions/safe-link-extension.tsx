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
        "span",
        mergeAttributes(this.options.HTMLAttributes, {
          ...HTMLAttributes,
          href: "",
          class: "editor-link",
          title: ""
        }),
        0
      ];
    }

    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, {
        ...HTMLAttributes,
        class: "editor-link",
        title: HTMLAttributes.href
      }),
      0
    ];
  }
});
