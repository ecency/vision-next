import { Button, Popover, PopoverContent } from "@/features/ui";
import { Node, nodePasteRule, NodeViewProps, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { UilTrash } from "@tooni/iconscout-unicons-react";

export const YOUTUBE_REGEX =
  /^https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?/i;

function getId(url: string) {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : "";
}

function toEmbedUrl(url: string) {
  const id = getId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

function YouTubeVideoViewer({
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
    youtubeVideo: {
      setYoutubeVideo: (options: { src: string; thumbnail: string }) => ReturnType;
    };
  }
}

export const YoutubeVideoExtension = Node.create({
  name: "youtubeVideo",
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
        tag: "div[data-youtube-video]"
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, thumbnail, ...rest } = HTMLAttributes;
    return [
      "p",
      mergeAttributes(rest),
      ["a", { href: src }, ["img", { src: thumbnail, alt: "" }]]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeVideoViewer);
  },
  addCommands() {
    return {
      setYoutubeVideo:
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
        find: new RegExp(YOUTUBE_REGEX.source, "gi"),
        type: this.type,
        getAttributes(match) {
          const id = match[1];
          return {
            src: match[0],
            thumbnail: `https://img.youtube.com/vi/${id}/0.jpg`
          };
        }
      })
    ];
  }
});

