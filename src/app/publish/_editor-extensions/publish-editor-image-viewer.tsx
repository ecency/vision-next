import { EditorContent, NodeViewProps, NodeViewWrapper, useEditor, Node } from "@tiptap/react";
import clsx from "clsx";
import Text from "@tiptap/extension-text";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import { EcencyRenderer as PureEcencyRenderer } from "@ecency/renderer";
import { memo } from "react";

const EcencyRenderer = memo(PureEcencyRenderer);

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
      className={clsx("publish-editor-image-viewer", selected && "ProseMirror-selectednode")}
      data-drag-handle
    >
      <EcencyRenderer value={src} />
      <div className="flex items-center justify-center text-sm font-sans text-center leading-relaxed">
        <EditorContent editor={editor} />
      </div>
    </NodeViewWrapper>
  );
}
