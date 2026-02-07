import Turndown from "turndown";
import { marked } from "marked";
import DOMPurify from "dompurify";

const ALIGNMENT_BLOCK_NODES = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];
const ALIGNMENT_VALUES = new Set(["center", "right", "left", "justify"]);

function extractTextAlign(style: string | null): string | undefined {
  if (!style) return undefined;
  return style
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((decl) => {
      const i = decl.indexOf(":");
      if (i === -1) return undefined;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const val = decl.slice(i + 1).trim();
      if (prop === "text-align" && val) return val.replace(/!important$/i, "").trim().toLowerCase();
      return undefined;
    })
    .find((v): v is string => !!v);
}

/**
 * Converts HTML from Tiptap editor to Markdown for publishing (preserves alignment as HTML)
 */
export function htmlToMarkdown(html: string | undefined): string {
  if (!html) {
    return "";
  }

  return new Turndown({
    codeBlockStyle: "fenced",
    headingStyle: "atx"
  })
    .addRule("alignment", {
      filter: function (node) {
        const style = node.getAttribute("style");
        const align = extractTextAlign(style);
        return (
          ALIGNMENT_BLOCK_NODES.includes(node.nodeName) &&
          !!align &&
          ALIGNMENT_VALUES.has(align)
        );
      },
      replacement: function (_, node) {
        const el = node as HTMLElement;
        const style = el.getAttribute("style");
        const align = extractTextAlign(style) ?? "left";
        const child = el.firstElementChild as HTMLElement | null;
        const onlyImage =
          el.childNodes.length === 1 &&
          child &&
          (child.tagName === "IMG" ||
            (child.tagName === "A" &&
              child.childNodes.length === 1 &&
              (child.firstElementChild as HTMLElement | null)?.tagName === "IMG"));
        if (onlyImage && child) {
          const content = child.outerHTML;
          if (align === "center") return `<center>${content}</center>`;
          if (align === "right") return `<div class="pull-right">${content}</div>`;
          if (align === "left") return `<div class="pull-left">${content}</div>`;
          return content;
        }
        el.setAttribute("data-align", align);
        el.removeAttribute("dir");
        return el.outerHTML;
      }
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
