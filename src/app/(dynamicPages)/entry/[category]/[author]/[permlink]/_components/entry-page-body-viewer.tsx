"use client";

import { Entry } from "@/entities";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@ecency/renderer";
import dynamic from "next/dynamic";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
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
  
  // Track component mount state and DOM stability
  const isMountedRef = useRef(false);
  const isHydrationCompleteRef = useRef(false);
  const enhancementTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Robust DOM verification system
  const verifyDOMStability = useCallback((element: Element): boolean => {
    if (!element || !isMountedRef.current) {
      return false;
    }

    // Check basic element properties
    if (!element.isConnected || !element.parentNode) {
      return false;
    }

    // Verify element is still in the document
    if (!document.contains(element)) {
      return false;
    }

    // Check if element has expected structure (should have content)
    if (!element.children.length && !element.textContent?.trim()) {
      return false;
    }

    // Verify parent chain is stable
    let current = element.parentNode;
    let depth = 0;
    while (current && current !== document && depth < 10) {
      if (!current.isConnected) {
        return false;
      }
      current = current.parentNode;
      depth++;
    }

    return true;
  }, []);

  // Check if React is currently in hydration mode
  const isReactHydrating = useCallback((): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    // Check for common hydration indicators
    // During hydration, React may suppress certain warnings and events
    const isHydrating = !isHydrationCompleteRef.current && 
                       typeof document !== "undefined" && 
                       document.readyState !== "complete";

    return isHydrating;
  }, []);

  // Sophisticated approach to wait for React hydration to complete
  const waitForHydrationAndSetupEnhancements = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    const element = document.getElementById("post-body");
    if (!element) {
      console.warn("Post body element not found, skipping enhancements");
      return;
    }

    // If we're still hydrating, wait and try again
    if (isReactHydrating()) {
      console.log("React is still hydrating, waiting...");
      enhancementTimerRef.current = setTimeout(waitForHydrationAndSetupEnhancements, 50);
      return;
    }

    // Verify DOM stability multiple times to ensure it's safe
    const verificationChecks = 3;
    let checkCount = 0;

    const performStabilityCheck = () => {
      if (!isMountedRef.current) {
        return;
      }

      const currentElement = document.getElementById("post-body");
      if (!currentElement || !verifyDOMStability(currentElement)) {
        if (checkCount < verificationChecks) {
          checkCount++;
          console.log(`DOM stability check ${checkCount}/${verificationChecks} failed, retrying...`);
          enhancementTimerRef.current = setTimeout(performStabilityCheck, 100);
          return;
        } else {
          console.warn("DOM stability checks failed after multiple attempts, skipping enhancements");
          return;
        }
      }

      // DOM is stable, proceed with enhancements
      setupEnhancementsWithDefensiveChecks(currentElement);
    };

    // Start stability checks
    enhancementTimerRef.current = setTimeout(performStabilityCheck, 100);
  }, [verifyDOMStability, isReactHydrating]);

  // Enhanced setup with additional defensive checks
  const setupEnhancementsWithDefensiveChecks = useCallback((element: Element) => {
    if (!isMountedRef.current) {
      return;
    }

    try {
      // Final verification before setup
      if (!verifyDOMStability(element)) {
        console.warn("Final DOM stability check failed, aborting enhancement setup");
        return;
      }

      // Create a MutationObserver to detect if DOM changes during setup
      let isSetupInterrupted = false;
      const observer = new MutationObserver((mutations) => {
        // Check if any mutation affects our target element or its ancestors
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            // Check if our element or its ancestors were removed
            for (const removedNode of mutation.removedNodes) {
              if (removedNode === element || 
                  (removedNode instanceof Element && removedNode.contains(element))) {
                isSetupInterrupted = true;
                console.warn("DOM modification detected during enhancement setup, aborting");
                return;
              }
            }
          }
        }
      });

      // Observe changes to the document body during setup
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Perform the actual setup with enhanced error handling
      setTimeout(() => {
        try {
          if (isSetupInterrupted || !isMountedRef.current) {
            return;
          }

          // Triple-check element validity right before calling external library
          if (!element.isConnected || !element.parentNode || !document.contains(element)) {
            console.warn("Element became invalid right before enhancement setup, skipping");
            return;
          }

          console.log("Setting up post enhancements on stable DOM");
          setupPostEnhancements(element, {
            onHiveOperationClick: (op) => {
              setSigningOperation(op);
            },
            TwitterComponent: Tweet,
          });

        } catch (error) {
          handleEnhancementError(error, "during setup execution");
        } finally {
          observer.disconnect();
        }
      }, 50); // Small additional delay to ensure DOM is completely stable

    } catch (error) {
      handleEnhancementError(error, "during defensive setup");
    }
  }, [verifyDOMStability]);

  // Enhanced error handling with race condition debugging
  const handleEnhancementError = useCallback((error: any, context: string) => {
    console.error(`Failed to setup post enhancements ${context}`, error);
    
    // Specific handling for parentNode errors (race condition indicator)
    if (error instanceof TypeError && error.message.includes("parentNode")) {
      console.error("=== RACE CONDITION DETECTED ===");
      console.error("This error suggests DOM elements were modified during enhancement setup");
      console.error("Context:", context);
      console.error("Component mounted:", isMountedRef.current);
      console.error("Hydration complete:", isHydrationCompleteRef.current);
      
      // Log DOM state for debugging
      const element = document.getElementById("post-body");
      if (element) {
        console.error("Element exists:", !!element);
        console.error("Element connected:", element.isConnected);
        console.error("Element has parent:", !!element.parentNode);
        console.error("Element in document:", document.contains(element));
      } else {
        console.error("post-body element not found in document");
      }
    }

    // Log additional context for other errors
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
  }, []);

  // Mount/unmount lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    
    // Set hydration complete after a brief delay to account for React's hydration process
    const hydrationTimer = setTimeout(() => {
      isHydrationCompleteRef.current = true;
    }, 200);

    return () => {
      isMountedRef.current = false;
      isHydrationCompleteRef.current = false;
      if (enhancementTimerRef.current) {
        clearTimeout(enhancementTimerRef.current);
        enhancementTimerRef.current = null;
      }
      clearTimeout(hydrationTimer);
    };
  }, []);

  // Main enhancement setup effect
  useEffect(() => {
    if (isRawContent || isEdit || editHistory) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    // Wait for component to be properly mounted
    if (!isMountedRef.current) {
      return;
    }

    // Start the sophisticated hydration-aware enhancement setup
    waitForHydrationAndSetupEnhancements();

    return () => {
      if (enhancementTimerRef.current) {
        clearTimeout(enhancementTimerRef.current);
        enhancementTimerRef.current = null;
      }
    };
  }, [isRawContent, isEdit, editHistory, waitForHydrationAndSetupEnhancements]);

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
