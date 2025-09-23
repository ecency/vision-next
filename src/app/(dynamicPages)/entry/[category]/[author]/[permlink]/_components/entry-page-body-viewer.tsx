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

    // Add a longer delay to wait for the client-side rendering to complete
    const timer = setTimeout(() => {
      const el = document.getElementById("post-body");

      if (!el) {
        console.warn("Post body element not found, retrying...");
        // Retry after additional delay if element is not found
        const retryTimer = setTimeout(() => {
          const retryEl = document.getElementById("post-body");
          if (retryEl) {
            attemptEnhancementSetup(retryEl);
          } else {
            console.warn("Post body element still not found after retry, skipping enhancements");
          }
        }, 200);
        return () => clearTimeout(retryTimer);
      }

      attemptEnhancementSetup(el);
    }, 250); // Increased delay to allow for client-side rendering

    const attemptEnhancementSetup = (element: HTMLElement) => {
      try {
        // Comprehensive DOM stability checks
        if (!element.isConnected) {
          console.warn("Post body element is not connected to DOM, skipping enhancements");
          return;
        }

        if (!element.parentNode) {
          console.warn("Post body element has no parent, skipping enhancements");
          return;
        }

        // Check if the element has actual content (not just loading placeholder)
        const hasContent = element.innerHTML && 
          element.innerHTML.trim().length > 0 && 
          !element.innerHTML.includes('loading-content') &&
          !element.innerHTML.includes('Loading full content');

        if (!hasContent) {
          console.warn("Post body element has no content yet, skipping enhancements");
          return;
        }

        // Additional check: ensure the element is visible and has dimensions
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          console.warn("Post body element has no dimensions, skipping enhancements");
          return;
        }

        // Final safety check: validate all child elements before enhancement
        const childElements = element.querySelectorAll('*');
        let hasInvalidElements = false;
        
        childElements.forEach((child) => {
          if (!child.isConnected || !child.parentNode) {
            hasInvalidElements = true;
            console.warn("Found disconnected child element during enhancement setup");
          }
        });

        if (hasInvalidElements) {
          console.warn("Post body contains disconnected child elements, skipping enhancements");
          return;
        }

        setupPostEnhancements(element, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });
      } catch (e) {
        // Avoid breaking the page if enhancements fail
        console.error("Failed to setup post enhancements", e);
        
        // Log additional context for debugging
        if (e instanceof TypeError && (e.message.includes("parentNode") || e.message.includes("null"))) {
          console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup");
          console.error("Element state:", {
            exists: !!element,
            isConnected: element?.isConnected,
            hasParent: !!element?.parentNode,
            hasContent: element?.innerHTML?.length > 0
          });
        }
      }
    };

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
