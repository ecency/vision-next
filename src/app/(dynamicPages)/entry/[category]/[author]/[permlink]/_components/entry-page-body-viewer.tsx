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
      
      // Check if element has a parent node
      if (!element.parentNode) {
        return false;
      }
      
      // Additional check to ensure the element is not being modified
      // by checking if it has the expected structure
      if (!element.classList.contains("entry-body")) {
        return false;
      }
      
      return true;
    };

    // Function to attempt post enhancement with retry logic
    const enhancePost = () => {
      const el = document.getElementById("post-body");
      
      if (!isElementReady(el)) {
        return false;
      }

      try {
        // Double-check element state right before enhancement
        if (!isElementReady(el)) {
          console.warn("Post body element became unstable during enhancement setup");
          return false;
        }

        setupPostEnhancements(el, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });
        
        return true;
      } catch (e) {
        // Avoid breaking the page if enhancements fail
        console.error("Failed to setup post enhancements", e);
        
        // Log additional context for debugging
        if (e instanceof TypeError && (e.message.includes("parentNode") || e.message.includes("null"))) {
          console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup");
        }
        
        return false;
      }
    };

    // Initial attempt with a delay to ensure DOM is stable
    const timer = setTimeout(() => {
      if (!enhancePost()) {
        // If first attempt fails, try again after a longer delay
        const retryTimer = setTimeout(() => {
          enhancePost();
        }, 300);
        
        return () => clearTimeout(retryTimer);
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
