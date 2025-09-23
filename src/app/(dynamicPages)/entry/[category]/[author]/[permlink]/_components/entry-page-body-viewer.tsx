"use client";

import { Entry } from "@/entities";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@ecency/renderer";
import dynamic from "next/dynamic";
import { useContext, useEffect, useLayoutEffect, useState, useRef } from "react";
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
  const enhancementInProgress = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const mutationObserverRef = useRef<MutationObserver>();

  // Use useLayoutEffect to ensure DOM manipulation happens after React's layout calculations
  // This provides better timing coordination with React's rendering cycle
  useLayoutEffect(() => {
    if (isRawContent || isEdit || editHistory) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    // Wait for hydration to complete by checking if React has taken control
    const waitForHydration = () => {
      return new Promise<void>((resolve) => {
        if (document.readyState === "complete") {
          // Additional check: wait for React hydration markers
          const checkHydration = () => {
            const el = document.getElementById("post-body");
            if (el && el.isConnected && !enhancementInProgress.current) {
              // Check if React has properly hydrated by looking for React fiber properties
              const hasReactFiber = el.hasOwnProperty('_reactInternalFiber') || 
                                   el.hasOwnProperty('_reactInternals') ||
                                   el.hasOwnProperty('__reactInternalInstance');
              
              if (hasReactFiber || document.querySelector('[data-reactroot]')) {
                resolve();
              } else {
                // Wait a bit more for React to hydrate
                setTimeout(checkHydration, 50);
              }
            } else {
              setTimeout(checkHydration, 50);
            }
          };
          
          // Wait at least 200ms for hydration to stabilize
          setTimeout(checkHydration, 200);
        } else {
          document.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => resolve(), 200);
          });
        }
      });
    };

    waitForHydration().then(() => {
      setupEnhancementsWithRetry();
    });

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
      enhancementInProgress.current = false;
    };
  }, [isRawContent, isEdit, editHistory]);

  // Robust DOM stability checks and error handling
  const validateDOMStability = (element: HTMLElement): boolean => {
    try {
      // Check if element is still connected to DOM
      if (!element.isConnected) {
        console.warn("Element is no longer connected to DOM");
        return false;
      }

      // Check if element has a valid parent node
      if (!element.parentNode) {
        console.warn("Element has no parent node");
        return false;
      }

      // Check if element is visible and has content
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        console.warn("Element has zero dimensions");
        return false;
      }

      // Check if element hasn't been moved or modified unexpectedly
      if (element.id !== "post-body") {
        console.warn("Element ID has changed");
        return false;
      }

      // Additional check: ensure element is not in process of being removed
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") {
        console.warn("Element is hidden");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error during DOM stability validation:", error);
      return false;
    }
  };

  const setupEnhancementsWithRetry = (retryCount = 0, maxRetries = 3) => {
    const el = document.getElementById("post-body");

    if (!el) {
      console.warn("Post body element not found");
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 100; // Exponential backoff: 100ms, 200ms, 400ms
        retryTimeoutRef.current = setTimeout(() => {
          setupEnhancementsWithRetry(retryCount + 1, maxRetries);
        }, delay);
      }
      return;
    }

    // Perform comprehensive DOM stability checks
    if (!validateDOMStability(el)) {
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 100;
        console.log(`DOM not stable, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
        retryTimeoutRef.current = setTimeout(() => {
          setupEnhancementsWithRetry(retryCount + 1, maxRetries);
        }, delay);
      } else {
        console.error("Failed to setup post enhancements: DOM stability checks failed after all retries");
      }
      return;
    }

    enhancementInProgress.current = true;

    // Set up mutation observer to detect DOM changes during enhancement
    const setupMutationObserver = (targetElement: HTMLElement) => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }

      mutationObserverRef.current = new MutationObserver((mutations) => {
        let significantChange = false;
        
        mutations.forEach((mutation) => {
          // Check for removed nodes that include our target element
          if (mutation.type === 'childList') {
            mutation.removedNodes.forEach((node) => {
              if (node === targetElement || (node as Element)?.contains?.(targetElement)) {
                console.warn("Post body element was removed from DOM during enhancement");
                significantChange = true;
              }
            });
          }
          
          // Check for attribute changes that might affect stability
          if (mutation.type === 'attributes' && mutation.target === targetElement) {
            const changedAttr = mutation.attributeName;
            if (changedAttr === 'id' || changedAttr === 'class') {
              console.warn(`Critical attribute '${changedAttr}' changed on post body element during enhancement`);
              significantChange = true;
            }
          }
        });

        if (significantChange && enhancementInProgress.current) {
          console.error("Significant DOM changes detected during enhancement setup - this may cause the TypeError");
        }
      });

      // Observe the target element and its parent for changes
      mutationObserverRef.current.observe(targetElement, {
        attributes: true,
        childList: true,
        subtree: false,
        attributeFilter: ['id', 'class', 'style']
      });

      // Also observe the parent to catch if the element gets removed
      if (targetElement.parentNode) {
        mutationObserverRef.current.observe(targetElement.parentNode, {
          childList: true,
          subtree: false
        });
      }
    };

    try {
      // Final validation right before enhancement
      if (!validateDOMStability(el)) {
        throw new Error("DOM became unstable just before enhancement setup");
      }

      // Set up monitoring before starting enhancements
      setupMutationObserver(el);

      setupPostEnhancements(el, {
        onHiveOperationClick: (op) => {
          setSigningOperation(op);
        },
        TwitterComponent: Tweet,
      });

      console.log("Post enhancements setup successfully");
      
      // Keep the mutation observer active for a short time after enhancement
      setTimeout(() => {
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to setup post enhancements:", error);
      
      // Enhanced error reporting for specific issues
      if (error instanceof TypeError) {
        if (error.message.includes("parentNode")) {
          console.error("ParentNode access error - DOM element was detached during enhancement");
          console.error("Element state:", {
            exists: !!el,
            connected: el?.isConnected,
            hasParent: !!el?.parentNode,
            id: el?.id
          });
        } else if (error.message.includes("Cannot read properties of null")) {
          console.error("Null reference error during enhancement - element became null");
        }
      }

      // Retry on specific errors that might be transient
      const isRetryableError = error instanceof TypeError && 
        (error.message.includes("parentNode") || error.message.includes("Cannot read properties of null"));
        
      if (isRetryableError && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 150; // Slightly longer delays for error retries
        console.log(`Retrying enhancement setup in ${delay}ms due to potentially transient error`);
        retryTimeoutRef.current = setTimeout(() => {
          setupEnhancementsWithRetry(retryCount + 1, maxRetries);
        }, delay);
      }
    } finally {
      enhancementInProgress.current = false;
    }
  };

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
