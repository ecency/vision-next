"use client";

import { useCallback, useContext, useState } from "react";

import { Button } from "@/features/ui";
import { flip, shift } from "@floating-ui/dom";
import { autoUpdate, useFloating } from "@floating-ui/react-dom";
import { UilClipboardAlt, UilComment, UilTwitter } from "@tooni/iconscout-unicons-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCopyToClipboard, useMountedState } from "react-use";
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
      return this.selection.getRangeAt(0).getBoundingClientRect();
    }
  }
}

export const SelectionPopover = ({ children, postUrl }: any) => {
  const { setSelection, commentsInputRef } = useContext(EntryPageContext);

  const [_, copyToClipboard] = useCopyToClipboard();
  const isMounted = useMountedState();

  const [selectedText, setSelectedText] = useState("");

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [flip(), shift()],
    placement: "top",
    transform: true
  });

  const onQuotesClick = (text: string) => {
    setSelection(`>${text}\n\n`);
    commentsInputRef?.current?.focus();
  };

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      refs.setReference(new VirtualSelectionReference(selection) as any);
    }
  }, [refs]);

  return (
    <div onMouseUp={handleSelection}>
      {children}

      {isMounted() &&
        createPortal(
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="p-2 flex border border-[--border-color] rounded-xl gap-3 bg-white items-center"
          >
            <Button
              noPadding={true}
              icon={<UilClipboardAlt />}
              appearance="gray-link"
              onClick={() => copyToClipboard(selectedText)}
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
          </div>,
          document.querySelector("#popper-container") as HTMLElement
        )}
    </div>
  );
};
