import { getQueryClient } from "@/core/react-query";
import { getTrendingTagsQueryOptions } from "@ecency/sdk";
import { computePosition, flip } from "@floating-ui/dom";
import { InfiniteData } from "@tanstack/react-query";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import { SuggestionProps } from "@tiptap/suggestion";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export const TAG_MENTION_PURE_REGEX = /#\w+/gi;
export const TAG_MENTION_SPAN_REGEX =
  /<span[^>]*data-type="tag"[^>]*>#([a-zA-Z0-9\-\.]*)<\/span>/gi;

const MentionList = forwardRef<{ onKeyDown: (e: any) => void }, SuggestionProps<string, any>>(
  function MentionListForwarded({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];

      if (item) {
        command({ id: item });
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      }
    }));

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden flex flex-col items-start border border-[--border-color] rounded-xl bg-white text-sm"
      >
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, position: "absolute" }}
              className={clsx(
                "border-b last:border-0 w-full border[--border-color] flex items-center p-2 gap-2 cursor-pointer hover:bg-gray-100 dark:hover-gray-800",
                index === selectedIndex ? "bg-blue-powder dark:bg-dark-default" : ""
              )}
              key={item}
              onClick={() => selectItem(index)}
            >
              #{item}
            </motion.div>
          ))}
          {items.length == 0 && <div className="p-2 opacity-50">No result</div>}
        </AnimatePresence>
      </motion.div>
    );
  }
);

export const TagMentionExtensionConfig = {
  items: async ({ query }: { query: string }) => {
    const options = getTrendingTagsQueryOptions(100);
    await getQueryClient()?.prefetchInfiniteQuery(options);

    const response = getQueryClient()?.getQueryData<InfiniteData<string[]>>(options.queryKey);
    const filteredItems =
      response?.pages?.[0]
        .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4) ?? [];

    if (!filteredItems.includes(query)) {
      filteredItems.push(query);
    }

    return filteredItems;
  },
  char: "#",
  pluginKey: new PluginKey("tag"),
  render: () => {
    const placementArea = document.querySelector("#popper-container");
    let reactRenderer: ReactRenderer<any> | null;

    return {
      onStart: (props: any) => {
        if (!props.clientRect) {
          return;
        }

        reactRenderer = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
          className: "absolute"
        });

        placementArea?.appendChild(reactRenderer.element);

        computePosition(props.decorationNode as HTMLElement, reactRenderer.element as HTMLElement, {
          middleware: [flip()]
        }).then(({ x, y }) => {
          Object.assign((reactRenderer.element as HTMLElement).style, {
            left: `${x}px`,
            top: `${y}px`
          });
        });
      },

      onUpdate(props: any) {
        if (!reactRenderer) {
          return;
        }

        reactRenderer.updateProps(props);

        computePosition(
          props.decorationNode as HTMLElement,
          reactRenderer.element as HTMLElement,
          { middleware: [flip()] }
        ).then(({ x, y }) => {
          Object.assign((reactRenderer.element as HTMLElement).style, {
            left: `${x}px`,
            top: `${y}px`
          });
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          reactRenderer?.element.classList.add("hidden");
          return true;
        }

        return reactRenderer?.ref?.onKeyDown(props);
      },

      onExit() {
        if (reactRenderer) {
          // ReactRenderer handles removing its element from the DOM on destroy.
          // Manually removing the element can race with React's unmount logic
          // and cause "The node to be removed is not a child of this node" errors.
          reactRenderer.destroy();
          // reset the reference so a new renderer can be created next time
          reactRenderer = null;
        }
      }
    };
  }
};
