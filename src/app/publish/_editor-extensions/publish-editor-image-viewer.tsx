import { Button, StyledTooltip } from "@/features/ui";
import { proxifyImageSrc } from "@ecency/render-helper";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, Node, NodeViewProps, NodeViewWrapper, useEditor } from "@tiptap/react";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import Image from "next/image";

export function PublishEditorImageViewer({
  node: {
    attrs: { src, alt }
  },
  updateAttributes,
  deleteNode
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

  return (
    <NodeViewWrapper
      onClick={() => editor?.chain().selectTextblockEnd().focus().run()}
      className="publish-editor-image-viewer cursor-grab border border-transparent hover:border-blue-dark-sky"
      data-drag-handle
    >
      <StyledTooltip
        content={
          <div className="rounded-lg flex gap-2 pl-1 py-1 border border-[--border-color]">
            {src.includes("https://images.ecency.com") && (
              <Button
                noPadding={true}
                size="xs"
                appearance="link"
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
                appearance="link"
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
                appearance="link"
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
            <Button
              className="!h-auto"
              icon={<UilTrash />}
              size="xs"
              appearance="link"
              onClick={deleteNode}
            />
          </div>
        }
      >
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Image className="w-auto max-w-full" src={src} width={200} height={200} alt={alt} />
          <div className="flex items-center justify-center text-sm font-sans text-center leading-relaxed py-4">
            <EditorContent editor={editor} className="cursor-text" />
          </div>
        </motion.div>
      </StyledTooltip>
    </NodeViewWrapper>
  );
}
