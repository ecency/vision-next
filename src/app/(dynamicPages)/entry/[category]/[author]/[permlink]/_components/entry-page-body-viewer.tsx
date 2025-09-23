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

    let mounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 50; // Start with 50ms delay
    let timeoutId: NodeJS.Timeout | null = null;

    const setupEnhancements = () => {
      if (!mounted) return;

      const el = document.getElementById("post-body");

      // More robust null checking to handle race conditions
      if (!el) {
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(setupEnhancements, retryDelay * retryCount);
        }
        return;
      }

      // Check if element is connected to the DOM and has parentNode
      if (!el.parentNode || !el.isConnected) {
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(setupEnhancements, retryDelay * retryCount);
        }
        return;
      }

      // Additional check to ensure the element is stable in the DOM
      requestAnimationFrame(() => {
        if (!mounted) return;
        
        // Double-check the element is still valid after the animation frame
        const currentEl = document.getElementById("post-body");
        if (!currentEl || !currentEl.parentNode || !currentEl.isConnected) {
          if (retryCount < maxRetries) {
            retryCount++;
            timeoutId = setTimeout(setupEnhancements, retryDelay * retryCount);
          }
          return;
        }

        try {
          setupPostEnhancements(currentEl, {
            onHiveOperationClick: (op) => {
              setSigningOperation(op);
            },
            TwitterComponent: Tweet,
          });
        } catch (e) {
          // Avoid breaking the page if enhancements fail
          console.error("Failed to setup post enhancements", e);
          
          // If it's specifically a parentNode error and we have retries left, try again
          if (e instanceof TypeError && 
              e.message.includes("parentNode") && 
              retryCount < maxRetries) {
            retryCount++;
            timeoutId = setTimeout(setupEnhancements, retryDelay * retryCount);
          }
        }
      });
    };

    // Use a small initial delay to let React finish hydration
    timeoutId = setTimeout(setupEnhancements, 10);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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
