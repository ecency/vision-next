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

  // Ensure we only run enhancement after hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Wait for hydration to complete before attempting any DOM manipulation
    if (!isHydrated) {
      return;
    }

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

    // Validate that the post body has actual content to enhance
    const hasValidContent = (element: HTMLElement): boolean => {
      try {
        // Check if there are any child elements to process
        const hasChildren = element.children.length > 0;
        if (!hasChildren) {
          console.warn("Post body has no child elements, skipping enhancements");
          return false;
        }

        // Verify children are properly connected to the DOM
        const firstChild = element.children[0];
        if (firstChild instanceof HTMLElement) {
          try {
            // Try to access parentNode of first child to detect disconnected nodes
            const hasValidParent = !!firstChild.parentNode;
            if (!hasValidParent) {
              console.warn("Child elements appear disconnected from DOM, skipping enhancements");
              return false;
            }
          } catch (error) {
            console.warn("Unable to verify child element connectivity:", error);
            return false;
          }
        }

        return true;
      } catch (error) {
        console.warn("Content validation failed:", error);
        return false;
      }
    };

    if (!isElementSafe(el)) {
      return;
    }

    // Use requestAnimationFrame to ensure DOM has been painted before proceeding
    // This helps with hydration timing issues
    const rafId = requestAnimationFrame(() => {
      // Add a delay to ensure DOM is fully rendered and stable
      // Increased to 300ms for iOS Safari to allow more time for cross-origin iframe loading
      const timer = setTimeout(() => {
        try {
          // Re-verify the element is still safe before proceeding
          if (!isElementSafe(el)) {
            console.warn("Post body element is not safely accessible, skipping enhancements");
            return;
          }

          // Validate that content is ready for enhancement
          if (!hasValidContent(el)) {
            console.warn("Post body content is not ready for enhancements, skipping");
            return;
          }

          setupPostEnhancements(el, {
            onHiveOperationClick: (op) => {
              setSigningOperation(op);
            },
            TwitterComponent: Tweet,
          });
        } catch (e) {
          // Avoid breaking the page if enhancements fail, e.g. due to missing embeds or DOM structure issues
          console.error("Failed to setup post enhancements", e);

          // Enhanced error handling for iOS Safari specific issues
          if (e instanceof TypeError) {
            if (e.message.includes("parentNode")) {
              console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup");
              console.error("This is often caused by hydration mismatches between server and client rendering");
            } else if (e.message.includes("null is not an object")) {
              console.error("iOS Safari cross-origin security error detected - iframe embeds may be restricted");
              console.error("The post may contain cross-origin content that iOS Safari blocks during DOM manipulation");
            }
          } else if (e instanceof Error && e.name === "SecurityError") {
            console.error("Cross-origin security error detected - this is common on iOS Safari with iframe embeds");
          }
        }
      }, 300);

      return () => clearTimeout(timer);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isRawContent, isEdit, editHistory, isHydrated]);

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
