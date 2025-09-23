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

    let retryCount = 0;
    const maxRetries = 3;
    
    const setupEnhancements = () => {
      const el = document.getElementById("post-body");

      if (!el) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupEnhancements, 100 * retryCount); // Progressive delay
        } else {
          console.warn("Post body element not found after retries, skipping enhancements");
        }
        return;
      }

      // More comprehensive DOM connection check to handle hydration timing issues
      if (!el.isConnected || !el.parentNode || !document.body.contains(el)) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupEnhancements, 100 * retryCount); // Progressive delay
        } else {
          console.warn("Post body element is not properly connected to DOM after retries, skipping enhancements");
        }
        return;
      }

      try {
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
    };

    // Initial delay to ensure hydration is complete, then start setup
    const timer = setTimeout(setupEnhancements, 250);

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
