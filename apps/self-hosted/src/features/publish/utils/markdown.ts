import Turndown from "turndown";
import { marked } from "marked";
import DOMPurify from "dompurify";

/**
 * Converts HTML from Tiptap editor to Markdown for publishing
 */
export function htmlToMarkdown(html: string | undefined): string {
  if (!html) {
    return "";
  }

  return new Turndown({
    codeBlockStyle: "fenced",
    headingStyle: "atx"
  })
    .addRule("table", {
      filter: function (node) {
        return node.nodeName === "TABLE";
      },
      replacement: function (_, node) {
        const colgroup = (node as HTMLElement).querySelector("colgroup");
        colgroup?.remove();
        return (node as HTMLElement).outerHTML;
      }
    })
    .addRule("image", {
      filter: "img",
      replacement: function (_, node) {
        const element = node as HTMLElement;
        const src = element.getAttribute("src") ?? "";
        const alt = element.getAttribute("alt") ?? "";
        return `![${alt}](${src})`;
      }
    })
    .turndown(html);
}

/**
 * Converts Markdown to HTML for loading into Tiptap editor
 */
export function markdownToHtml(markdown: string | undefined): string {
  if (!markdown) {
    return "";
  }

  try {
    const parsed = marked.parse(markdown);
    const sanitized = typeof parsed === "string" ? DOMPurify.sanitize(parsed) : "";
    return sanitized;
  } catch (error) {
    console.error("Failed to parse markdown:", error);
    return "";
  }
}
