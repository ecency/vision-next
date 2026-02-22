import { Button, Popover, PopoverContent } from "@/features/ui";
import { proxifyImageSrc } from "@ecency/render-helper";
import { mergeAttributes, Node, NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Image from "next/image";

function VideoViewer({
  node: {
    attrs: { src, thumbnail, status }
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
          <div className="flex justify-center">
            {status === "publish_manual" && (
              <div className="relative w-full overflow-hidden h-[375px]">
                <Image
                  width={600}
                  height={400}
                  src={proxifyImageSrc(thumbnail, 0, 0, "match")}
                  alt="thumbnail"
                  className="w-full h-full object-cover"
                />
                <Image
                  src="/assets/speak-logo.svg"
                  width={48}
                  height={48}
                  alt=""
                  className="absolute top-4 left-4"
                />
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <div className="font-sans text-white backdrop-blur-md p-4 rounded-xl">
                    {i18next.t("publish.video-availability")}
                  </div>
                </div>
              </div>
            )}
            {status === "published" && (
              <iframe
                width="560"
                height="315"
                src={(() => {
                  try {
                    const url = new URL(src, "https://3speak.tv");
                    url.pathname = url.pathname.replace("/watch", "/embed");
                    if (!url.searchParams.has("mode")) {
                      url.searchParams.set("mode", "iframe");
                    }
                    return url.toString();
                  } catch {
                    return src;
                  }
                })()}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            )}
          </div>
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
    threeSpeakVideo: {
      set3SpeakVideo: (options: { src: string; thumbnail: string; status: string }) => ReturnType;
    };
  }
}

export const ThreeSpeakVideoExtension = Node.create({
  name: "threeSpeakVideo",
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
      },
      status: {
        default: null
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-three-speak-video]"
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        href: HTMLAttributes.src
      },
      ["img", { src: HTMLAttributes.thumbnail, alt: "" }]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoViewer);
  },
  addCommands() {
    return {
      set3SpeakVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options
          });
        }
    };
  }
});
