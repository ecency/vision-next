import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const selectionPluginKey = new PluginKey<boolean>("selection");

/**
 * Keeps the active selection visible while the editor is blurred — e.g. when
 * the link form input steals focus. The native browser `::selection` highlight
 * is hidden as soon as a contenteditable loses focus, which made it look like
 * "nothing is selected" while editing a link. We paint a synthetic highlight
 * only in that blurred state; when the editor is focused we let the browser
 * draw the real selection.
 *
 * Focus is tracked in the plugin's own state (toggled from DOM focus/blur
 * events) so the decorations recompute on focus changes — reading
 * `editor.isFocused` directly inside `decorations()` would go stale because
 * blur does not, by itself, dispatch a transaction.
 */
export const Selection = Extension.create({
  name: "selection",

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin<boolean>({
        key: selectionPluginKey,
        state: {
          init: () => false,
          apply(tr, focused) {
            const meta = tr.getMeta(selectionPluginKey);
            return typeof meta === "boolean" ? meta : focused;
          }
        },
        props: {
          handleDOMEvents: {
            focus: (view) => {
              if (selectionPluginKey.getState(view.state) !== true) {
                view.dispatch(view.state.tr.setMeta(selectionPluginKey, true));
              }
              return false;
            },
            blur: (view) => {
              if (selectionPluginKey.getState(view.state) !== false) {
                view.dispatch(view.state.tr.setMeta(selectionPluginKey, false));
              }
              return false;
            }
          },
          decorations(state) {
            const focused = selectionPluginKey.getState(state);

            if (state.selection.empty || focused || !editor.isEditable) {
              return null;
            }

            return DecorationSet.create(state.doc, [
              Decoration.inline(state.selection.from, state.selection.to, {
                class: "bg-blue-dark-sky bg-opacity-30 rounded-[2px]"
              })
            ]);
          }
        }
      })
    ];
  }
});

export default Selection;
