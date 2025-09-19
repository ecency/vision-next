// @ts-ignore
import { strikethrough } from "@joplin/turndown-plugin-gfm";
import Turndown from "turndown";

const CENTERED_TEXT_RULE_NODES = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];
const CENTERED_TEXT_RULE_STYLES = [
  "text-align: center",
  "text-align: right",
  "text-align: left",
  "text-align: justify"
];

export function markdownToHtml(html: string | undefined) {
  if (!html) {
    return "";
  }

  return new Turndown({
    codeBlockStyle: "fenced"
  })
    .addRule("centeredText", {
      filter: function (node) {
        const styles = node.getAttribute("style");
        return (
          CENTERED_TEXT_RULE_NODES.includes(node.nodeName) &&
          !!styles &&
          CENTERED_TEXT_RULE_STYLES.includes(styles)
        );
      },
      replacement: function (_, node) {
        const element = node as HTMLElement;
        const styles = element.getAttribute("style");
        const align = styles?.replace("text-align: ", "") ?? "auto";

        const child = element.firstElementChild as HTMLElement | null;
        const onlyImage =
          element.childNodes.length === 1 &&
          child &&
          (child.tagName === "IMG" ||
            (child.tagName === "A" &&
              child.childNodes.length === 1 &&
              (child.firstElementChild as HTMLElement | null)?.tagName === "IMG"));

        if (onlyImage && child) {
          const content = child.outerHTML;

          if (align === "center") {
            return `<center>${content}</center>`;
          }

          if (align === "right") {
            return `<div class="pull-right">${content}</div>`;
          }

          if (align === "left") {
            return `<div class="pull-left">${content}</div>`;
          }

          return content;
        }

        element.setAttribute("data-align", align);
        element.removeAttribute("dir");
        return element.outerHTML;
      }
    })
    .addRule("textColor", {
      filter: function (node) {
        if (node.nodeName !== "SPAN") {
          return false;
        }

        const element = node as HTMLElement;
        return !!element.style.color;
      },
      replacement: function (_, node) {
        const element = node as HTMLElement;
        const color = element.style.color;
        const clone = element.cloneNode(true) as HTMLElement;

        if (color) {
          clone.setAttribute("style", `color: ${color}`);
        } else {
          clone.removeAttribute("style");
        }

        return clone.outerHTML;
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
        const cls = element.getAttribute("class");
        const attrs = [
          `src="${src}"`,
          `alt="${alt}"`,
          cls ? `class="${cls}"` : undefined
        ].filter(Boolean);
        const imgHtml = `<img ${attrs.join(" ")} />`;

        if (cls === "pull-left" || cls === "pull-right") {
          return `<div class="${cls}">${imgHtml}</div>`;
        }

        return imgHtml;
      }
    })
    .use(strikethrough)
    .turndown(html);
}
