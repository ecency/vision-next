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

    const el = document.getElementById("post-body");

    if (!(el instanceof HTMLElement)) {
      return;
    }

    // Enhanced null-safe checking for iOS Safari compatibility
    const isElementSafe = (element: HTMLElement | null): boolean => {
      try {
        if (!element) return false;

        // Safe parentNode access with try-catch for iOS Safari iframe security errors
        const hasParent = (() => {
          try {
            return !!element.parentNode;
          } catch (securityError) {
            // iOS Safari throws SecurityError when trying to access parentNode in cross-origin contexts
            console.warn("Cross-origin security restriction detected, treating as disconnected element");
            return false;
          }
        })();

        if (!hasParent) return false;

        // Additional safety check for isConnected property
        try {
          return element.isConnected;
        } catch (securityError) {
          // Fallback if isConnected check also fails due to security restrictions
          console.warn("isConnected check failed, assuming element is connected");
          return true;
        }
      } catch (error) {
        console.warn("Element safety check failed:", error);
        return false;
      }
    };

    if (!isElementSafe(el)) {
      return;
    }

    // Add a small delay to ensure DOM is fully rendered and stable
    const timer = setTimeout(() => {
      try {
        // Re-verify the element is still safe before proceeding
        if (!isElementSafe(el)) {
          console.warn("Post body element is not safely accessible, skipping enhancements");
          return;
        }

        // Pre-sanitize the DOM tree to remove or isolate problematic elements
        // that could cause Safari security errors during enhancement processing
        const sanitizeForSafariSecurity = (element: HTMLElement): void => {
          try {
            // Find all iframes and cross-origin elements that might cause issues
            const potentiallyProblematicElements = element.querySelectorAll('iframe, embed, object, [src*="://"], [href*="://"]');
            
            potentiallyProblematicElements.forEach((problematicEl) => {
              try {
                // Test if we can safely access parentNode on this element
                const testAccess = problematicEl.parentNode;
                // If we can access it without error, test isConnected as well
                const testConnected = problematicEl.isConnected;
              } catch (securityError) {
                // If we get a security error, mark this element for safe handling
                try {
                  // Add a data attribute to flag elements that cause security errors
                  // This helps the renderer library skip these elements
                  (problematicEl as HTMLElement).dataset.safariSecurityRestricted = 'true';
                  console.warn('Marked element as Safari security restricted:', problematicEl.tagName);
                } catch (markingError) {
                  // If we can't even mark the element, we need to isolate it
                  try {
                    // Create a safe wrapper div around problematic elements
                    const wrapper = document.createElement('div');
                    wrapper.className = 'safari-restricted-content';
                    wrapper.dataset.originalTag = problematicEl.tagName.toLowerCase();
                    wrapper.style.cssText = 'position: relative; display: block; opacity: 0.8;';
                    
                    // Insert wrapper before the problematic element
                    if (problematicEl.parentNode) {
                      problematicEl.parentNode.insertBefore(wrapper, problematicEl);
                      // Move the problematic element into the wrapper
                      wrapper.appendChild(problematicEl);
                    }
                  } catch (isolationError) {
                    console.warn('Could not isolate problematic element, removing from enhancement scope');
                    // As a last resort, temporarily hide the element during enhancement
                    try {
                      (problematicEl as HTMLElement).style.visibility = 'hidden';
                      (problematicEl as HTMLElement).dataset.temporarilyHidden = 'true';
                    } catch (hideError) {
                      // Cannot even hide it, log and continue
                      console.warn('Element completely inaccessible due to security restrictions');
                    }
                  }
                }
              }
            });
          } catch (sanitizationError) {
            console.warn('DOM sanitization failed, proceeding with basic setup:', sanitizationError);
          }
        };

        // Perform pre-sanitization to handle Safari security issues
        sanitizeForSafariSecurity(el);

        setupPostEnhancements(el, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });

        // Restore any temporarily hidden elements after enhancement
        try {
          const temporarilyHiddenElements = el.querySelectorAll('[data-temporarily-hidden="true"]');
          temporarilyHiddenElements.forEach((hiddenEl) => {
            try {
              (hiddenEl as HTMLElement).style.visibility = '';
              (hiddenEl as HTMLElement).removeAttribute('data-temporarily-hidden');
            } catch (restoreError) {
              console.warn('Could not restore temporarily hidden element');
            }
          });
        } catch (restoreError) {
          console.warn('Error during element restoration:', restoreError);
        }

      } catch (e) {
        // Avoid breaking the page if enhancements fail, e.g. due to missing embeds or DOM structure issues
        console.error("Failed to setup post enhancements", e);

        // Enhanced error handling for iOS Safari specific issues
        if (e instanceof TypeError) {
          if (e.message.includes("parentNode")) {
            console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup");
          } else if (e.message.includes("null is not an object")) {
            console.error("iOS Safari cross-origin security error detected - iframe embeds may be restricted");
          }
        } else if (e instanceof Error && e.name === "SecurityError") {
          console.error("Cross-origin security error detected - this is common on iOS Safari with iframe embeds");
        }

        // Restore any temporarily hidden elements even if enhancement failed
        try {
          const temporarilyHiddenElements = el.querySelectorAll('[data-temporarily-hidden="true"]');
          temporarilyHiddenElements.forEach((hiddenEl) => {
            try {
              (hiddenEl as HTMLElement).style.visibility = '';
              (hiddenEl as HTMLElement).removeAttribute('data-temporarily-hidden');
            } catch (restoreError) {
              console.warn('Could not restore temporarily hidden element after enhancement failure');
            }
          });
        } catch (restoreError) {
          console.warn('Error during cleanup after enhancement failure:', restoreError);
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
