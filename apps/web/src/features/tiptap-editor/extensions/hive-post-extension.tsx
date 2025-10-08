import { Button, Popover, PopoverContent } from "@/features/ui";
import { EcencyRenderer } from "@ecency/renderer";
import { Node, nodePasteRule, NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { memo } from "react";

const MemoEcencyRenderer = memo(EcencyRenderer);

// Matches a Hive post URL and preserves any trailing query parameters
export const HIVE_POST_PURE_REGEX =
  /^https?:\/\/(.*)\/(.*)\/(@[\w.\d-]+)\/([^?\s]+)(?:\?[^\s]*)?/gi;

function PostViewer({
  node: {
    attrs: { href }
  },
  deleteNode
}: NodeViewProps) {
  return (
    <NodeViewWrapper
      className=" cursor-grab border border-transparent hover:border-blue-dark-sky my-4"
      data-drag-handle
    >
      <Popover
        stopPropagationForChild={true}
        directContent={<MemoEcencyRenderer value={href} />}
        behavior="hover"
      >
        <PopoverContent>
          <div className="flex gap-2">
            <Button
              noPadding={true}
              className="!h-auto"
              icon={<UilTrash />}
              size="xs"
              appearance="link"
              onClick={deleteNode}
            />
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    hivePost: {
      setHivePost: (options: { href: string }) => ReturnType;
    };
  }
}

export const HivePostExtension = Node.create({
  name: "hivePost",
  inline: false,
  group: "block",
  draggable: true,
  addAttributes() {
    return {
      href: {
        default: null
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-hive-post]"
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        href: HTMLAttributes.href
      },
      HTMLAttributes.href
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PostViewer);
  },
  addCommands() {
    return {
      setHivePost:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options
          });
        }
    };
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: HIVE_POST_PURE_REGEX,
        type: this.type,
        getAttributes(match) {
          return {
            // Preserve referral or other query params in the link
            href: match[0]
          };
        }
      })
    ];
  }
});
