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

    let isCancelled = false;
    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 100;

    /**
     * Enhanced DOM stability check to ensure element is properly connected
     * and ready for manipulation by external libraries
     */
    const isDOMElementStable = (element: HTMLElement | null): boolean => {
      if (!element) return false;
      
      // Check basic existence and connection
      if (!element.isConnected || !element.parentNode) return false;
      
      // Check if element is actually in the document
      if (!document.contains(element)) return false;
      
      // Check if the element has proper dimensions (indicates it's rendered)
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
      
      // Additional check: ensure the element's parent is also stable
      const parent = element.parentNode as HTMLElement;
      if (!parent || !parent.isConnected) return false;
      
      return true;
    };

    /**
     * Attempts to setup post enhancements with retry logic and robust error handling
     */
    const attemptEnhancementSetup = () => {
      if (isCancelled) return;

      const el = document.getElementById("post-body");

      if (!isDOMElementStable(el)) {
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.warn(`Post body element not stable (attempt ${retryCount}/${maxRetries}), retrying in ${delay}ms`);
          setTimeout(attemptEnhancementSetup, delay);
          return;
        } else {
          console.warn("Post body element never became stable, skipping enhancements after", maxRetries, "attempts");
          return;
        }
      }

      try {
        // Final validation before calling setupPostEnhancements
        if (!el || !isDOMElementStable(el)) {
          console.warn("Final validation failed: Post body element is not stable, skipping enhancements");
          return;
        }

        setupPostEnhancements(el, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });
      } catch (e) {
        // Enhanced error handling for hydration race conditions
        console.error("Failed to setup post enhancements", e);
        
        if (e instanceof TypeError) {
          if (e.message.includes("parentNode")) {
            console.error("DOM hydration race condition detected - element was modified during enhancement setup");
          } else if (e.message.includes("Cannot read properties of null")) {
            console.error("Null reference error during enhancement setup - DOM may be unstable");
          }
        }
        
        // If we encounter a DOM-related error and still have retries left, try again
        if (retryCount < maxRetries && 
            (e instanceof TypeError && (e.message.includes("parentNode") || e.message.includes("Cannot read properties of null")))) {
          retryCount++;
          const delay = baseDelay * Math.pow(2, retryCount - 1);
          console.warn(`Retrying enhancement setup due to DOM error (attempt ${retryCount}/${maxRetries}) in ${delay}ms`);
          setTimeout(attemptEnhancementSetup, delay);
        }
      }
    };

    // Start the enhancement setup process with initial delay to allow hydration to complete
    const initialTimer = setTimeout(attemptEnhancementSetup, baseDelay);

    return () => {
      isCancelled = true;
      clearTimeout(initialTimer);
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
