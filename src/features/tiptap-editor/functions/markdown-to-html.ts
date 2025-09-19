// @ts-ignore
import { strikethrough } from "@joplin/turndown-plugin-gfm";
import Turndown from "turndown";

import { TEXT_COLOR_CLASS_PREFIX } from "@/app/publish/_constants/text-colors";

const CENTERED_TEXT_RULE_NODES = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];
const CENTERED_TEXT_ALIGNMENTS = new Set(["center", "right", "left", "justify"]);

function extractTextAlignValue(styles: string | null): string | undefined {
  if (!styles) {
    return undefined;
  }

  return styles
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(":");

      if (separatorIndex === -1) {
        return undefined;
      }

      const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
      const value = declaration.slice(separatorIndex + 1).trim();

      if (property === "text-align" && value) {
        return value.replace(/!important$/i, "").trim().toLowerCase();
      }

      return undefined;
    })
    .find((value): value is string => !!value);
}

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
        const align = extractTextAlignValue(styles);

        return (
          CENTERED_TEXT_RULE_NODES.includes(node.nodeName) &&
          !!align &&
          CENTERED_TEXT_ALIGNMENTS.has(align)
        );
      },
      replacement: function (_, node) {
        const element = node as HTMLElement;
        const styles = element.getAttribute("style");
        const align = extractTextAlignValue(styles) ?? "auto";

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
        const classList = Array.from(element.classList ?? []);
        const hasColorClass = classList.some((className) =>
          className.startsWith(TEXT_COLOR_CLASS_PREFIX)
        );

        return !!element.style.color || hasColorClass;
      },
      replacement: function (_, node) {
        const element = node as HTMLElement;
        const color = element.style.color;
        const clone = element.cloneNode(true) as HTMLElement;
        const colorClass = Array.from(element.classList ?? []).find((className) =>
          className.startsWith(TEXT_COLOR_CLASS_PREFIX)
        );

        if (color) {
          clone.setAttribute("style", `color: ${color}`);
        } else {
          const classColorValue = colorClass?.slice(TEXT_COLOR_CLASS_PREFIX.length);
          if (classColorValue) {
            clone.setAttribute("style", `color: #${classColorValue}`);
          } else {
            clone.removeAttribute("style");
          }
        }

        if (colorClass) {
          clone.classList.add(colorClass);
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
