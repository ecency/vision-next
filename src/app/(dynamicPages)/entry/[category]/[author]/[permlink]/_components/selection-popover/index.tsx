"use client";

import { useCallback, useContext, useState } from "react";

import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { flip, shift } from "@floating-ui/dom";
import { useFloating } from "@floating-ui/react-dom";
import { safeAutoUpdate } from "@ui/util";
import { UilClipboardAlt, UilComment, UilTwitter } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useClickAway, useCopyToClipboard, useMountedState } from "react-use";
import { EntryPageContext } from "../context";

// https://github.com/FezVrasta/react-popper#usage-without-a-reference-htmlelement
class VirtualSelectionReference {
  selection: Selection;
  constructor(selection: Selection) {
    this.selection = selection;
  }

  get clientWidth() {
    return this.getBoundingClientRect()?.width ?? 0;
  }

  get clientHeight() {
    return this.getBoundingClientRect()?.height ?? 0;
  }

  getBoundingClientRect() {
    if (this.selection.rangeCount > 0) {
      const rect = this.selection.getRangeAt(0).getBoundingClientRect();
      // Sanity check
      if (rect) return rect;
    }
  }
}

export const SelectionPopover = ({ children, postUrl }: any) => {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { setSelection, commentsInputRef } = useContext(EntryPageContext);

  const [_, copyToClipboard] = useCopyToClipboard();
  const isMounted = useMountedState();

  const [selectedText, setSelectedText] = useState("");

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: safeAutoUpdate,
    middleware: [flip(), shift()],
    placement: "top",
    transform: true
  });

  useClickAway(refs.floating, () => selectedText && setSelectedText(""));

  const onQuotesClick = useCallback(
    (text: string) => {
      setSelection(`>${text}\n\n`);
      commentsInputRef?.current?.focus();
    },
    [commentsInputRef, setSelection]
  );

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      refs.setReference(new VirtualSelectionReference(selection) as any);
      setSelectedText(selection.toString());
    } else {
      setSelectedText("");
    }
  }, [refs]);

  return (
    <div onMouseUp={handleSelection}>
      {children}

      {isMounted() && selectedText && floatingStyles?.left != null &&
        createPortal(
          selectedText ? (
            <div ref={refs.setFloating} style={floatingStyles}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 flex border border-[--border-color] rounded-xl gap-3 bg-white items-center"
              >
                <Button
                  noPadding={true}
                  icon={<UilClipboardAlt />}
                  appearance="gray-link"
                  onClick={() => {
                    copyToClipboard(selectedText);
                    setSelectedText("");
                    setSelection("");
                  }}
                />
                <Link
                  href={`https://twitter.com/intent/tweet?text=${selectedText} https://ecency.com${postUrl}`}
                  target="_external"
                >
                  <Button
                    noPadding={true}
                    icon={<UilTwitter />}
                    appearance="gray-link"
                    onClick={() => setSelectedText("")}
                  />
                </Link>

                {activeUser && (
                  <Button
                    noPadding={true}
                    icon={<UilComment />}
                    appearance="gray-link"
                    onClick={() => {
                      setSelectedText("");
                      onQuotesClick(selectedText);
                      document
                        .getElementsByClassName("comment-box")[0]
                        .scrollIntoView({ block: "center" });
                    }}
                  />
                )}
              </motion.div>
            </div>
          ) : (
            <></>
          ),
          document.querySelector("#popper-container") as HTMLElement
        )}
    </div>
  );
};
