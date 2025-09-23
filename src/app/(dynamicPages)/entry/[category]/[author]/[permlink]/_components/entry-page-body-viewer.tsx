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

    // Add a small delay to ensure DOM is fully rendered and hydration is complete
    const timer = setTimeout(() => {
      try {
        // Re-check conditions after delay in case they changed during hydration
        if (isRawContent || isEdit || editHistory) {
          return;
        }

        const el = document.getElementById("post-body");

        // Enhanced safety checks - verify element exists and is properly connected
        if (!el || !el.parentNode || !el.isConnected) {
          console.warn("Post body element is not available or not properly connected to DOM, skipping enhancements");
          return;
        }

        // Additional check to ensure the element is in the document
        if (!document.body.contains(el)) {
          console.warn("Post body element is not in the document, skipping enhancements");
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
