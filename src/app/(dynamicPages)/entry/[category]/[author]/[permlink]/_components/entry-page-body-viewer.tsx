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

    // Function to safely check if element is ready for enhancement
    const isElementReady = (element: HTMLElement | null): element is HTMLElement => {
      if (!element) {
        return false;
      }
      
      // Check if element is connected to the DOM
      if (!element.isConnected) {
        return false;
      }
      
      // Check if parentNode exists and is not null
      if (!element.parentNode) {
        return false;
      }
      
      // Additional safety check: ensure parentNode is also connected
      if (element.parentNode && 'isConnected' in element.parentNode && !element.parentNode.isConnected) {
        return false;
      }
      
      return true;
    };

    const el = document.getElementById("post-body");

    if (!isElementReady(el)) {
      console.warn("Post body element is not ready for enhancements", {
        elementExists: !!el,
        isConnected: el?.isConnected,
        hasParentNode: !!el?.parentNode,
        parentNodeConnected: el?.parentNode && 'isConnected' in el.parentNode ? el.parentNode.isConnected : 'unknown'
      });
      return;
    }

    // Add a small delay to ensure DOM is fully rendered and stable
    const timer = setTimeout(() => {
      try {
        // Re-verify the element is still ready before proceeding
        const currentEl = document.getElementById("post-body");
        if (!isElementReady(currentEl)) {
          console.warn("Post body element became unavailable during timeout, skipping enhancements");
          return;
        }

        setupPostEnhancements(currentEl, {
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
          console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup", {
            error: e.message,
            stack: e.stack,
            currentElement: document.getElementById("post-body"),
            timestamp: new Date().toISOString()
          });
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
