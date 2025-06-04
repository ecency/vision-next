import { Button, StyledTooltip } from "@/features/ui";
import { autoUpdate, flip, shift, useFloating } from "@floating-ui/react-dom";
import { Editor, posToDOMRect } from "@tiptap/core";
import {
  UilArrow,
  UilBold,
  UilItalic,
  UilLink,
  UilTextStrikeThrough
} from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway } from "react-use";
import { PublishEditorToolbarLinkForm } from "./link-form";

interface Props {
  editor: any | null;
}

export function BubbleMenu({ editor }: Props) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"link">();
  const [editingLink, setEditingLink] = useState<string>();

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [flip(), shift()],
    placement: "top",
    transform: true
  });

  // useClickAway(refs.floating, () => show && setShow(false));

  useEffect(() => {
    const updateMenu = () => {
      if (!editor) {
        return;
      }
      const {
        selection: { from, to }
      } = editor.state;

      const isText = editor.state.doc.textBetween(from, to).length > 0;
      let isLink = false;

      (editor as Editor).view.state.doc.nodesBetween(from, to, (node) => {
        if (
          node.type.name === "text" &&
          node.marks.length > 0 &&
          node.marks[0].type.name === "link"
        ) {
          isLink = true;
          setEditingLink(node.marks[0].attrs.href);
          setMode("link");
        }
      });

      console.log(isLink);

      if (!editor.isFocused || (!isText && !isLink)) {
        setShow(false);
        setMode(undefined);
        setEditingLink(undefined);
        return;
      }

      refs.setReference({
        getBoundingClientRect: () => posToDOMRect(editor.view, from, to)
      });

      setShow(true);
    };

    editor?.on("selectionUpdate", updateMenu);

    return () => {
      editor?.off("selectionUpdate", updateMenu);
      editor?.off("blur");
    };
  }, [editor, refs]);

  return (
    typeof document !== "undefined" &&
    createPortal(
      <AnimatePresence>
        {show && (
          <motion.div
            ref={refs.setFloating}
            className="z-[1070] absolute"
            style={{ ...floatingStyles, visibility: show ? "visible" : "hidden" }}
          >
            {!mode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[--border-color] max-w-[320px] text-blue-dark-sky px-1 rounded-lg text-xs font-semibold flex items-center"
              >
                <StyledTooltip content={i18next.t("publish.action-bar.bold")}>
                  <Button
                    appearance={editor?.isActive("bold") ? "link" : "gray-link"}
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    icon={<UilBold />}
                  />
                </StyledTooltip>
                <StyledTooltip content={i18next.t("publish.action-bar.italic")}>
                  <Button
                    appearance={editor?.isActive("italic") ? "link" : "gray-link"}
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    icon={<UilItalic />}
                  />
                </StyledTooltip>
                <StyledTooltip content={i18next.t("publish.action-bar.strikethrough")}>
                  <Button
                    appearance={editor?.isActive("strike") ? "link" : "gray-link"}
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    icon={<UilTextStrikeThrough />}
                  />
                </StyledTooltip>
                <StyledTooltip content={i18next.t("publish.action-bar.code")}>
                  <Button
                    appearance={editor?.isActive("code") ? "link" : "gray-link"}
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleCode().run()}
                    icon={<UilArrow />}
                  />
                </StyledTooltip>
                <div className="h-[40px] w-[1px] bg-[--border-color] mx-2" />
                <StyledTooltip content={i18next.t("publish.action-bar.link")}>
                  <Button
                    appearance={editor?.isActive("code") ? "link" : "gray-link"}
                    size="sm"
                    onClick={() => {
                      setMode("link");
                      editor.chain().focus().extendMarkRange("link").setLink({ href: "" }).run();
                    }}
                    icon={<UilLink />}
                  />
                </StyledTooltip>
              </motion.div>
            )}
            {mode === "link" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[--border-color] max-w-[320px] text-blue-dark-sky p-1.5 rounded-lg text-xs font-semibold flex items-center"
              >
                <PublishEditorToolbarLinkForm
                  initialValue={editingLink}
                  deletable={editingLink !== undefined}
                  onSubmit={(href) => {
                    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
                    setShow(false);
                  }}
                  onDelete={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>,
      document.querySelector("#popper-container") ?? document.createElement("div")
    )
  );
}
