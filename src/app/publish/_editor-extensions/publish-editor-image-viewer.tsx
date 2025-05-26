import { useUploadPostImage } from "@/api/mutations";
import { Button, Popover, PopoverContent, StyledTooltip } from "@/features/ui";
import { proxifyImageSrc } from "@ecency/render-helper";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, Node, NodeViewProps, NodeViewWrapper, useEditor } from "@tiptap/react";
import { UilSpinner, UilTrash } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import Image from "next/image";
import { useMount } from "react-use";

export function PublishEditorImageViewer({
  node: {
    attrs: { src, alt }
  },
  updateAttributes,
  deleteNode,
  selected
}: NodeViewProps) {
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    content: alt ?? "",
    extensions: [
      Node.create({
        name: "oneLine",
        topNode: true,
        content: "block"
      }),
      Paragraph,
      Placeholder.configure({
        placeholder: ({ node }) => {
          return "Caption";
        }
      }),
      Text
    ],
    onUpdate({ editor }) {
      const text = editor.getText();
      updateAttributes({
        alt: text
      });
    }
  });

  const { mutateAsync: uploadImage } = useUploadPostImage();

  useMount(() => {
    if (src.startsWith("blob")) {
      fetch(src)
        .then((response) => response.blob())
        .then((blob) => new File([blob], alt, { type: blob.type }))
        .then((file) => uploadImage({ file }))
        .then(({ url }) => updateAttributes({ src: url }));
    }
  });

  return (
    <NodeViewWrapper
      onClick={() => editor?.chain().selectTextblockEnd().focus().run()}
      className={clsx(
        "publish-editor-image-viewer cursor-grab border hover:border-blue-dark-sky inline-flex relative",
        selected ? "border-blue-dark-sky" : "border-transparent"
      )}
      data-drag-handle
    >
      <Popover
        className="inline-flex"
        directContent={
          <motion.div
            className="inline-flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div
              className={clsx(
                "absolute top-0 left-0 w-full h-full items-center justify-center",
                src.startsWith("blob") ? "flex" : "hidden"
              )}
            >
              <UilSpinner className="w-12 h-12 text-white animate-spin" />
            </div>
            <Image
              className={clsx("w-auto max-w-full", src.startsWith("blob") && "grayscale blur-sm")}
              src={src}
              width={200}
              height={200}
              alt={alt}
            />
            <div className="flex items-center justify-center text-sm font-sans text-center leading-relaxed py-4">
              <EditorContent editor={editor} className="cursor-text" />
            </div>
          </motion.div>
        }
        behavior="hover"
      >
        <PopoverContent>
          <div className="flex gap-2">
            {src.includes("https://images.ecency.com") && (
              <Button
                noPadding={true}
                size="xs"
                appearance="gray-link"
                className="!h-auto"
                onClick={() =>
                  updateAttributes({
                    src: proxifyImageSrc(src, 200, 200, "match")
                  })
                }
              >
                Small
              </Button>
            )}
            {src.includes("https://images.ecency.com") && (
              <Button
                noPadding={true}
                size="xs"
                appearance="gray-link"
                className="!h-auto"
                onClick={() =>
                  updateAttributes({
                    src: proxifyImageSrc(src, 400, 400, "match")
                  })
                }
              >
                Medium
              </Button>
            )}
            {src.includes("https://images.ecency.com") && (
              <Button
                noPadding={true}
                size="xs"
                appearance="gray-link"
                className="!h-auto"
                onClick={() =>
                  updateAttributes({
                    src: proxifyImageSrc(src, 0, 0, "match")
                  })
                }
              >
                Original
              </Button>
            )}
            {src.includes("https://images.ecency.com") && (
              <div className="h-[36px] -my-2 w-[1px] bg-[--border-color]" />
            )}
            <Button
              noPadding={true}
              className="!h-auto"
              icon={<UilTrash />}
              size="xs"
              appearance="gray-link"
              onClick={deleteNode}
            />
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}
