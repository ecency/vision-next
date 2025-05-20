// @ts-ignore
import { strikethrough } from "@joplin/turndown-plugin-gfm";
import Turndown from "turndown";

export function markdownToHtml(html: string | undefined) {
  if (!html) {
    return "";
  }

  return new Turndown({
    codeBlockStyle: "fenced"
  })
    .addRule("centeredParagraph", {
      filter: function (node) {
        const styles = node.getAttribute("style");
        return (
          ["P"].includes(node.nodeName) &&
          !!styles &&
          ["text-align: center", "text-align: right", "text-align: justify"].includes(styles)
        );
      },
      replacement: function (content, node) {
        const styles = (node as HTMLElement).getAttribute("style");
        const align = styles?.replace("text-align: ", "") ?? "auto";

        (node as HTMLElement).setAttribute("dir", align);
        return (node as HTMLElement).outerHTML;
      }
    })
    .use(strikethrough)
    .keep(["table", "tbody", "th", "tr", "td"])
    .turndown(html);
}
