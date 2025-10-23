import { Button, Popover, PopoverContent } from "@/features/ui";
import { Node, nodePasteRule, NodeViewProps, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { UilTrash } from "@tooni/iconscout-unicons-react";

export const LOOM_REGEX = /^(https?:)?\/\/www.loom.com\/share\/(.*)/i;

function getId(url: string) {
  const match = url.match(LOOM_REGEX);
  return match ? match[2] : "";
}

function toEmbedUrl(url: string) {
  const id = getId(url);
  return id ? `https://www.loom.com/embed/${id}` : url;
}

function LoomVideoViewer({
  node: {
    attrs: { src }
  },
  deleteNode
}: NodeViewProps) {
  return (
    <NodeViewWrapper
      className=" cursor-grab border border-transparent hover:border-blue-dark-sky my-6"
      data-drag-handle
    >
      <Popover
        directContent={
          <iframe
            width="560"
            height="315"
            src={toEmbedUrl(src)}
            className="mx-auto"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups"
          ></iframe>
        }
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
    loomVideo: {
      setLoomVideo: (options: { src: string; thumbnail: string }) => ReturnType;
    };
  }
}

export const LoomVideoExtension = Node.create({
  name: "loomVideo",
  inline: false,
  group: "block",
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null
      },
      thumbnail: {
        default: null
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-loom-video]"
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, thumbnail, ...rest } = HTMLAttributes;
    return ["p", mergeAttributes(rest), src];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LoomVideoViewer);
  },
  addCommands() {
    return {
      setLoomVideo:
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
        find: new RegExp(LOOM_REGEX.source, "gi"),
        type: this.type,
        getAttributes(match) {
          const id = match[2];
          return {
            src: match[0],
            thumbnail: `https://img.loom.com/vi/${id}/0.jpg`
          };
        }
      })
    ];
  }
});
