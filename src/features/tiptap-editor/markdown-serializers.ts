import { TextSerializer } from "@tiptap/core";

const BASIC_SERIALIZERS: Record<string, TextSerializer> = {
  text: ({ node }) => node.text || "",
  heading: ({ node }) => `${"#".repeat(node.attrs.level)} ${node.textContent}\n`,
  paragraph: ({ node }) => `${node.textContent}\n`,
  bold: ({ node }) => `**${node.textContent}**`,
  italic: ({ node }) => `*${node.textContent}*`,
  code: ({ node }) => `\`${node.textContent}\``,
  codeBlock: ({ node }) => "```\n" + node.textContent + "\n```\n\n",
  orderedList: ({ node }) => {
    let result = "";
    let index = 1;
    node.content.forEach((child) => {
      const itemText = child.textContent || "";
      result += `${index}. ${itemText}\n`;
      index++;
    });
    return result + "\n";
  },

  bulletList: ({ node }) => {
    let result = "";
    node.content.forEach((child) => {
      const itemText = child.textContent || "";
      result += `- ${itemText}\n`;
    });
    return result + "\n";
  },
  link: ({ node }) => `[${node.textContent || node.attrs.href}](${node.attrs.href})`,
  image: ({ node }) => `![${node.attrs.alt ?? ""}](${node.attrs.src})`,
  //   tag: ({ node }) => `#${node.attrs.id}`,
  //   mention: ({ node }) => `@${node.attrs.id}`,
  horizontalRule: () => "---\n",
  hardBreak: () => "  \n"
};

export const MARKDOWN_SERIALIZERS: Record<string, TextSerializer> = {
  ...BASIC_SERIALIZERS,
  table: ({ node }) => {
    let result = "";
    const rows: string[] = [];

    const serializeNode = (innerNode: Parameters<TextSerializer>[0]["node"]) => {
      if (innerNode.type.name === "text") {
        return innerNode.text || "";
      }
      const serializer =
        BASIC_SERIALIZERS[innerNode.type.name] || (({ node }) => node.textContent || "");
      return serializer({ node: innerNode } as any);
    };

    node.content.forEach((rowNode, rowIndex) => {
      let row = "|";
      rowNode.content.forEach((cellNode) => {
        let cellContent = "";
        cellNode.content.forEach((contentNode) => {
          cellContent += serializeNode(contentNode);
        });
        row += ` ${cellContent.trim()} |`;
      });
      rows.push(row);
      if (rowIndex === 0) {
        const cellCount = rowNode.content.childCount;
        const separator = `|${"---|".repeat(cellCount)}`;
        rows.push(separator);
      }
    });
    result = rows.join("\n");
    return result + "\n";
  }
};
