import { getQueryClient } from "@/core/react-query";
import { UserAvatar } from "@/features/shared";
import { getSearchAccountsByUsernameQueryOptions } from "@ecency/sdk";
import { autoPlacement, computePosition } from "@floating-ui/dom";
import { ReactRenderer } from "@tiptap/react";
import { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import clsx from "clsx";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const MentionList = forwardRef<{ onKeyDown: (e: any) => void }, SuggestionProps<string, any>>(
  ({ items, command }, ref) => {
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
      <div className="flex flex-col items-start border border-[--border-color] rounded-xl bg-white text-sm">
        {items.length ? (
          items.map((item, index) => (
            <div
              className={clsx(
                "border-b w-full border[--border-color] flex items-center p-2 gap-2",
                index === selectedIndex ? "bg-blue-powder dark:bg-dark-default" : ""
              )}
              key={index}
              onClick={() => selectItem(index)}
            >
              <UserAvatar username={item} size="small" />
              {item}
            </div>
          ))
        ) : (
          <div className="p-2 opacity-50">No result</div>
        )}
      </div>
    );
  }
);

export const MentionExtensionConfig: SuggestionOptions<string> = {
  items: async ({ query }) => {
    const options = getSearchAccountsByUsernameQueryOptions(query);
    await getQueryClient()?.prefetchQuery(options);

    const response = getQueryClient()?.getQueryData(options.queryKey);
    return response ?? [];
  },
  render: () => {
    const placementArea = document.querySelector("#popper-container");
    let reactRenderer: ReactRenderer<any>;

    return {
      onStart: (props) => {
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
          middleware: [autoPlacement()]
        }).then(({ x, y }) => {
          Object.assign((reactRenderer.element as HTMLElement).style, {
            left: `${x}px`,
            top: `${y}px`
          });
        });
      },

      onUpdate(props) {
        reactRenderer.updateProps(props);

        computePosition(props.decorationNode as HTMLElement, reactRenderer.element as HTMLElement, {
          middleware: [autoPlacement()]
        }).then(({ x, y }) => {
          Object.assign((reactRenderer.element as HTMLElement).style, {
            left: `${x}px`,
            top: `${y}px`
          });
        });
      },

      onKeyDown(props) {
        if (props.event.key === "Escape") {
          reactRenderer.element.classList.add("hidden");
          return true;
        }

        return reactRenderer.ref?.onKeyDown(props);
      },

      onExit() {
        placementArea?.removeChild(reactRenderer.element);
        reactRenderer.destroy();
      }
    };
  }
};
