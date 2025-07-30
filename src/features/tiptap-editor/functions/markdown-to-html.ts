// @ts-ignore
import { strikethrough } from "@joplin/turndown-plugin-gfm";
import Turndown from "turndown";

const CENTERED_TEXT_RULE_NODES = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];
const CENTERED_TEXT_RULE_STYLES = [
  "text-align: center",
  "text-align: right",
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
        const styles = (node as HTMLElement).getAttribute("style");
        const align = styles?.replace("text-align: ", "") ?? "auto";

        (node as HTMLElement).setAttribute("dir", align);
        return (node as HTMLElement).outerHTML;
      }
    })
    .addRule("table", {
      filter: function (node) {
        return node.nodeName === "TABLE";
      },
      replacement: function (_, node) {
        const colgroup = (node as HTMLElement).querySelector("colgroup");
        if (colgroup && node.contains(colgroup)) {
          node.removeChild(colgroup);
        }

        return (node as HTMLElement).outerHTML;
      }
    })
    .use(strikethrough)
    .turndown(html);
}
