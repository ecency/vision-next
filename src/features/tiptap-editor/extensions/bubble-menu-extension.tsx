import { Button, StyledTooltip } from "@/features/ui";
import { autoUpdate, flip, shift, useFloating } from "@floating-ui/react-dom";
import { posToDOMRect } from "@tiptap/core";
import { UilArrow, UilBold, UilItalic, UilTextStrikeThrough } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway } from "react-use";

interface Props {
  editor: any | null;
}

export function BubbleMenu({ editor }: Props) {
  const [show, setShow] = useState(false);

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [flip(), shift()],
    placement: "top",
    transform: true
  });

  useClickAway(refs.floating, () => show && setShow(false));

  useEffect(() => {
    const updateMenu = () => {
      if (!editor) {
        return;
      }
      const {
        selection: { empty, from, to }
      } = editor.state;

      const isText = editor.state.doc.textBetween(from, to).length > 0;
      if (empty || !editor.isFocused || !isText) {
        setShow(false);
        return;
      }

      refs.setReference({
        getBoundingClientRect: () => posToDOMRect(editor.view, from, to)
      });

      setShow(true);
    };

    editor?.on("selectionUpdate", updateMenu);
    editor?.on("focus", updateMenu);
    editor?.on("blur", () => setShow(false));

    return () => {
      editor?.off("selectionUpdate", updateMenu);
      editor?.off("focus", updateMenu);
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[--border-color] max-w-[320px] text-blue-dark-sky p-1 rounded-lg text-xs font-semibold flex items-center"
            >
              <StyledTooltip content={i18next.t("publish.action-bar.bold")}>
                <Button
                  appearance={editor?.isActive("bold") ? "link" : "gray-link"}
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  disabled={!editor?.can().chain().focus().toggleBold().run()}
                  icon={<UilBold />}
                />
              </StyledTooltip>
              <StyledTooltip content={i18next.t("publish.action-bar.italic")}>
                <Button
                  appearance={editor?.isActive("italic") ? "link" : "gray-link"}
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  disabled={!editor?.can().chain().focus().toggleItalic().run()}
                  icon={<UilItalic />}
                />
              </StyledTooltip>
              <StyledTooltip content={i18next.t("publish.action-bar.strikethrough")}>
                <Button
                  appearance={editor?.isActive("strike") ? "link" : "gray-link"}
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  disabled={!editor?.can().chain().focus().toggleStrike().run()}
                  icon={<UilTextStrikeThrough />}
                />
              </StyledTooltip>
              <StyledTooltip content={i18next.t("publish.action-bar.code")}>
                <Button
                  appearance={editor?.isActive("code") ? "link" : "gray-link"}
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleCode().run()}
                  disabled={!editor?.can().chain().focus().toggleCode().run()}
                  icon={<UilArrow />}
                />
              </StyledTooltip>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.querySelector("#popper-container") ?? document.createElement("div")
    )
  );
}
