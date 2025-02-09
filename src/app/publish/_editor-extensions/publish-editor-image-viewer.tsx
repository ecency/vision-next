import { EditorContent, NodeViewProps, NodeViewWrapper, useEditor, Node } from "@tiptap/react";
import clsx from "clsx";
import Text from "@tiptap/extension-text";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";

export function PublishEditorImageViewer({
  node: {
    attrs: { src, alt }
  },
  selected,
  updateAttributes
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
          return "Image caption";
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
      className={clsx("publish-editor-image-viewer", selected && "ProseMirror-selectednode")}
      data-drag-handle
    >
      <img src={src} alt={alt} />
      <div className="flex items-center justify-center text-sm font-sans text-center mt-2 leading-relaxed">
        <EditorContent editor={editor} />
      </div>
    </NodeViewWrapper>
  );
}
