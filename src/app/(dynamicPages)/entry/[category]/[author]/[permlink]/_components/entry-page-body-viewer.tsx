"use client";

import { Entry } from "@/entities";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@ecency/renderer";
import dynamic from "next/dynamic";
import { useContext, useEffect, useState } from "react";
import TransactionSigner from "@/features/shared/transactions/transaction-signer";
import { EntryPageContext } from "./context";
import { EntryPageEdit } from "./entry-page-edit";
import { makeEntryPath } from "@/utils";

const Tweet = dynamic(() => import("react-tweet").then((m) => m.Tweet), {
  ssr: false,
});

interface Props {
  entry: Entry;
}

export function EntryPageBodyViewer({ entry }: Props) {
  const [signingOperation, setSigningOperation] = useState<string>();
  const { isRawContent, isEdit, editHistory } = useContext(EntryPageContext);

  useEffect(() => {
    if (isRawContent || isEdit || editHistory) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    const el = document.getElementById("post-body");

    if (!el || !el.parentNode) {
      return;
    }

    // Additional defensive checks for content validation
    try {
      // Validate that the element contains valid HTML content
      if (!el.innerHTML || el.innerHTML.trim() === "") {
        console.warn("Post body element is empty, skipping enhancements");
        return;
      }

      // Check if the element has any child nodes to work with
      if (!el.hasChildNodes()) {
        console.warn("Post body element has no child nodes, skipping enhancements");
        return;
      }

      // Validate that the element is properly attached to the DOM
      if (!document.contains(el)) {
        console.warn("Post body element is not attached to document, skipping enhancements");
        return;
      }

      setupPostEnhancements(el, {
        onHiveOperationClick: (op) => {
          setSigningOperation(op);
        },
        TwitterComponent: Tweet,
      });
    } catch (e) {
      // Enhanced error handling with more detailed logging for debugging
      const error = e as Error;
      const errorContext = {
        message: error.message,
        stack: error.stack,
        elementId: el?.id,
        elementExists: !!el,
        elementAttached: el ? document.contains(el) : false,
        elementHasParent: el ? !!el.parentNode : false,
        elementHasContent: el ? el.innerHTML.length > 0 : false,
        elementHasChildren: el ? el.hasChildNodes() : false,
        url: window.location.href
      };
      
      console.error("Failed to setup post enhancements:", errorContext);
      
      // Log additional details for specific error types
      if (error.message.includes("parentNode")) {
        console.error("Detected parentNode access error - this may be due to malformed HTML content");
      }
      
      // Still avoid breaking the page by not re-throwing the error
    }
  }, [isRawContent, isEdit, editHistory]);

  return (
    <EntryPageViewerManager>
      {!isEdit && (
        <SelectionPopover
          postUrl={makeEntryPath(entry.category, entry.author, entry.permlink)}
        >
          {/* nothing here, SSR will render #post-body */}
        </SelectionPopover>
      )}
      {isEdit && entry.parent_author && <EntryPageEdit entry={entry} />}
      <TransactionSigner
        show={!!signingOperation}
        onHide={() => setSigningOperation(undefined)}
        operation={signingOperation}
      />
    </EntryPageViewerManager>
  );
}
