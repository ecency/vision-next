import { Mark, mergeAttributes } from "@tiptap/core";

export interface DelStrikeOptions {
  HTMLAttributes: Record<string, any>;
}

export const DelStrike = Mark.create<DelStrikeOptions>({
  name: "strike",

  addOptions() {
    return {
      HTMLAttributes: {}
    } satisfies DelStrikeOptions;
  },

  parseHTML() {
    return [
      { tag: "del" },
      { tag: "s" },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (value) =>
          typeof value === "string" && value.includes("line-through") ? {} : false
      },
      {
        style: "text-decoration-line",
        consuming: false,
        getAttrs: (value) =>
          typeof value === "string" && value.includes("line-through") ? {} : false
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "del",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      setStrike:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleStrike:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetStrike:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name)
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-x": () => this.editor.commands.toggleStrike()
    };
  }
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    strike: {
      setStrike: () => ReturnType;
      toggleStrike: () => ReturnType;
      unsetStrike: () => ReturnType;
    };
  }
}
