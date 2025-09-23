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
  const [isHydrated, setIsHydrated] = useState(false);
  const { isRawContent, isEdit, editHistory } = useContext(EntryPageContext);

  // Hydration-safe state management
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only proceed after hydration is complete to prevent timing conflicts
    if (!isHydrated || isRawContent || isEdit || editHistory) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    // Enhanced DOM validation function
    const validatePostBodyElement = (el: HTMLElement | null): boolean => {
      if (!el) {
        return false;
      }

      // Check if element exists and is connected to DOM
      if (!el.isConnected || !el.parentNode || !document.body.contains(el)) {
        return false;
      }

      // Check if the element has expected structure and isn't empty
      if (el.children.length === 0 && el.innerHTML.trim() === "") {
        return false;
      }

      // Verify the element has expected classes indicating proper hydration
      if (!el.classList.contains("entry-body")) {
        return false;
      }

      // Additional stability check - ensure parent is stable
      const parent = el.parentNode as HTMLElement;
      if (!parent || !parent.isConnected) {
        return false;
      }

      return true;
    };

    // Setup enhancements with comprehensive error handling
    const setupEnhancements = (): boolean => {
      const el = document.getElementById("post-body");

      if (!validatePostBodyElement(el)) {
        return false;
      }

      try {
        setupPostEnhancements(el!, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });
        return true;
      } catch (e) {
        // Enhanced error logging for debugging hydration issues
        console.error("Failed to setup post enhancements", {
          error: e,
          elementId: el?.id,
          elementConnected: el?.isConnected,
          elementParent: !!el?.parentNode,
          elementClasses: el?.className,
          elementChildCount: el?.children.length,
          timestamp: new Date().toISOString()
        });
        
        // Specific handling for parentNode errors
        if (e instanceof TypeError && e.message.includes("parentNode")) {
          console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup", {
            elementHTML: el?.outerHTML?.substring(0, 200) + "...",
            parentNodeType: el?.parentNode?.nodeType,
            parentNodeName: el?.parentNode?.nodeName
          });
        }
        return false;
      }
    };

    let attempts = 0;
    const maxAttempts = 5;
    const baseDelay = 150;
    let timeoutId: NodeJS.Timeout;

    const attemptSetup = () => {
      attempts++;
      
      if (setupEnhancements()) {
        return; // Success, no need to retry
      }

      if (attempts < maxAttempts) {
        // Exponential backoff with jitter to avoid thundering herd
        const delay = baseDelay * Math.pow(2, attempts - 1) + Math.random() * 50;
        timeoutId = setTimeout(attemptSetup, delay);
      } else {
        console.warn(`Failed to setup post enhancements after ${maxAttempts} attempts`, {
          finalElementId: document.getElementById("post-body")?.id,
          finalElementExists: !!document.getElementById("post-body"),
          finalElementConnected: document.getElementById("post-body")?.isConnected,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Initial delay to allow for hydration completion
    timeoutId = setTimeout(attemptSetup, 100);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isHydrated, isRawContent, isEdit, editHistory]);

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
