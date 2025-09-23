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

    // Add a small delay to ensure DOM is fully rendered and stable
    const timer = setTimeout(() => {
      try {
        // Verify the element still exists and is properly attached to the DOM
        if (!el || !el.isConnected || !el.parentNode) {
          console.warn("Post body element is not properly connected to DOM, skipping enhancements");
          return;
        }

        // Additional safety checks for DOM element integrity
        const parent = el.parentNode;
        if (!parent || typeof parent.contains !== "function") {
          console.warn("Parent node is invalid, skipping enhancements");
          return;
        }

        // Verify the element is still contained in its parent
        if (!parent.contains(el)) {
          console.warn("Element is no longer contained in its parent, skipping enhancements");
          return;
        }

        setupPostEnhancements(el, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });
      } catch (e) {
        // Avoid breaking the page if enhancements fail, e.g. due to missing embeds or DOM structure issues
        console.error("Failed to setup post enhancements", e);
        
        // Log additional context for debugging
        if (e instanceof TypeError && e.message.includes("parentNode")) {
          console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup");
          console.error("Element state:", {
            elementExists: !!el,
            isConnected: el?.isConnected,
            hasParent: !!el?.parentNode,
            parentNodeType: el?.parentNode?.nodeType
          });
        }

        // If this is a chunk-related error, let the global error handler catch it
        if (e instanceof TypeError && (
          e.message.includes("Cannot read properties of null") ||
          e.message.includes("parentNode")
        )) {
          // Re-throw chunk-related errors to be caught by ErrorBoundary
          throw e;
        }
      }
    }, 100);

    return () => clearTimeout(timer);
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
