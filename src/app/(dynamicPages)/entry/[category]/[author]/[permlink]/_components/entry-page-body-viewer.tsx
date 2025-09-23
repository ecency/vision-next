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

    // Enhanced DOM stability checking function
    const isDomElementStable = (element: HTMLElement): boolean => {
      // Check if element exists and is connected to the DOM
      if (!element || !element.isConnected) {
        return false;
      }

      // Check if element has a parent node
      if (!element.parentNode || !element.parentElement) {
        return false;
      }

      // Verify the element is actually in the document
      if (!document.contains(element)) {
        return false;
      }

      // Check if the element has the expected properties for post body
      if (!element.id || element.id !== "post-body") {
        return false;
      }

      return true;
    };

    // Robust enhancement setup function with comprehensive checks
    const setupEnhancements = (): boolean => {
      const el = document.getElementById("post-body");

      if (!el) {
        console.warn("Post body element not found, skipping enhancements");
        return false;
      }

      if (!isDomElementStable(el)) {
        console.warn("Post body element is not stable or properly connected to DOM, skipping enhancements");
        return false;
      }

      try {
        setupPostEnhancements(el, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });
        console.debug("Post enhancements setup successfully");
        return true;
      } catch (e) {
        // Avoid breaking the page if enhancements fail
        console.error("Failed to setup post enhancements", e);
        
        // Log additional context for debugging hydration issues
        if (e instanceof TypeError && e.message.includes("parentNode")) {
          console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup");
          console.error("Element state:", {
            exists: !!el,
            isConnected: el?.isConnected,
            hasParentNode: !!el?.parentNode,
            hasParentElement: !!el?.parentElement,
            inDocument: el ? document.contains(el) : false
          });
        }
        return false;
      }
    };

    // Retry mechanism with exponential backoff to handle hydration timing
    let retryCount = 0;
    const maxRetries = 5;
    const initialDelay = 100;
    let timeoutId: NodeJS.Timeout;

    const attemptSetup = () => {
      if (setupEnhancements()) {
        return; // Success, no need to retry
      }

      retryCount++;
      if (retryCount < maxRetries) {
        // Exponential backoff with jitter to handle hydration timing issues
        const backoffDelay = initialDelay * Math.pow(1.5, retryCount);
        const jitter = Math.random() * 50; // Add randomness to avoid thundering herd
        const totalDelay = backoffDelay + jitter;
        
        console.debug(`Retrying post enhancement setup (attempt ${retryCount}/${maxRetries}) in ${Math.round(totalDelay)}ms`);
        timeoutId = setTimeout(attemptSetup, totalDelay);
      } else {
        console.warn(`Failed to setup post enhancements after ${maxRetries} attempts - DOM may be unstable due to hydration mismatch`);
      }
    };

    // Start the initial attempt after allowing time for hydration
    timeoutId = setTimeout(attemptSetup, initialDelay);

    return () => {
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
