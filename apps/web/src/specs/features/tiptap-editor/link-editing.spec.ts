import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { SafeLink } from "@/features/tiptap-editor/extensions/safe-link-extension";
import { normalizeLinkHref } from "@/features/tiptap-editor/functions/normalize-link-href";

describe("normalizeLinkHref", () => {
  it("prepends https:// to a bare domain", () => {
    expect(normalizeLinkHref("ecency.com")).toBe("https://ecency.com");
    expect(normalizeLinkHref("www.ecency.com/blog")).toBe("https://www.ecency.com/blog");
  });

  it("leaves an explicit scheme untouched", () => {
    expect(normalizeLinkHref("http://ecency.com")).toBe("http://ecency.com");
    expect(normalizeLinkHref("https://ecency.com")).toBe("https://ecency.com");
    expect(normalizeLinkHref("mailto:hello@ecency.com")).toBe("mailto:hello@ecency.com");
  });

  it("leaves relative, protocol-relative and anchor targets untouched", () => {
    expect(normalizeLinkHref("/trending")).toBe("/trending");
    expect(normalizeLinkHref("//cdn.example.com/a.png")).toBe("//cdn.example.com/a.png");
    expect(normalizeLinkHref("#section")).toBe("#section");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeLinkHref("  ecency.com  ")).toBe("https://ecency.com");
    expect(normalizeLinkHref("   ")).toBe("");
  });
});

function makeEditor(content: string) {
  return new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, SafeLink],
    content
  });
}

function findLinkRange(editor: Editor): { from: number; to: number } | null {
  let range: { from: number; to: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.marks.some((mark) => mark.type.name === "link")) {
      range = { from: pos, to: pos + node.nodeSize };
    }
  });
  return range;
}

describe("link selection detection (BubbleMenu mode decision)", () => {
  const html = '<p>Hello <a href="https://ecency.com">world</a> friend</p>';

  it("does NOT report a link when the whole document is selected", () => {
    const editor = makeEditor(html);
    try {
      editor.commands.selectAll();
      // This is the core of the select-all fix: a mixed selection must not be
      // treated as "editing a link", otherwise Cmd+A pops the link form.
      expect(editor.isActive("link")).toBe(false);
    } finally {
      editor.destroy();
    }
  });

  it("reports the link (with its href) when the cursor sits inside it", () => {
    const editor = makeEditor(html);
    try {
      const range = findLinkRange(editor);
      expect(range).not.toBeNull();

      editor.commands.setTextSelection(range!.from + 1);
      expect(editor.isActive("link")).toBe(true);
      expect(editor.getAttributes("link").href).toBe("https://ecency.com");
    } finally {
      editor.destroy();
    }
  });

  it("reports the link when the selection is wholly within it", () => {
    const editor = makeEditor(html);
    try {
      const range = findLinkRange(editor)!;
      editor.commands.setTextSelection({ from: range.from, to: range.to });
      expect(editor.isActive("link")).toBe(true);
    } finally {
      editor.destroy();
    }
  });

  it("does NOT report a link for a selection spanning the link plus plain text", () => {
    const editor = makeEditor(html);
    try {
      const range = findLinkRange(editor)!;
      // From the very start of the paragraph through the end of the link covers
      // plain "Hello " + the link → not a pure link selection.
      editor.commands.setTextSelection({ from: 1, to: range.to });
      expect(editor.isActive("link")).toBe(false);
    } finally {
      editor.destroy();
    }
  });
});
