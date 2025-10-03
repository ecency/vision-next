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
      // Global error handler to catch any errors that escape from setupPostEnhancements
      // This is crucial for iOS Safari where errors can occur asynchronously within the renderer
      const globalErrorHandler = (event: ErrorEvent) => {
        const error = event.error;
        
        // Check if this is the iOS Safari parentNode error we're trying to prevent
        if (error instanceof TypeError && 
            (error.message.includes("parentNode") || 
             error.message.includes("null is not an object"))) {
          console.warn("Caught iOS Safari cross-origin error in setupPostEnhancements:", error.message);
          
          // Prevent this error from being reported to Sentry
          event.preventDefault();
          event.stopPropagation();
          
          // Return true to mark the error as handled
          return true;
        }
        
        // Check for SecurityError related to cross-origin iframe access
        if (error instanceof Error && error.name === "SecurityError") {
          console.warn("Caught SecurityError in setupPostEnhancements:", error.message);
          
          // Prevent this error from being reported to Sentry
          event.preventDefault();
          event.stopPropagation();
          
          return true;
        }
      };

      // Add the global error handler before calling setupPostEnhancements
      window.addEventListener("error", globalErrorHandler, true);

      try {
        // Re-verify the element is still safe before proceeding
        if (!isElementSafe(el)) {
          console.warn("Post body element is not safely accessible, skipping enhancements");
          window.removeEventListener("error", globalErrorHandler, true);
          return;
        }

        // Final safety check: verify the element still has a parent and is connected
        try {
          if (!el.parentNode || !el.isConnected) {
            console.warn("Element is disconnected or has no parent, skipping enhancements");
            window.removeEventListener("error", globalErrorHandler, true);
            return;
          }
        } catch (securityError) {
          // If we can't even check parentNode due to security errors, it's too risky to proceed
          console.warn("Security restriction detected when checking element, skipping enhancements");
          window.removeEventListener("error", globalErrorHandler, true);
          return;
        }

        // Additional layer of error handling specifically for setupPostEnhancements
        // to catch synchronous errors from the @ecency/renderer package
        try {
          setupPostEnhancements(el, {
            onHiveOperationClick: (op) => {
              setSigningOperation(op);
            },
            TwitterComponent: Tweet,
          });
        } catch (rendererError) {
          // This catches errors thrown directly by setupPostEnhancements
          console.error("setupPostEnhancements threw an error:", rendererError);
          
          if (rendererError instanceof TypeError && rendererError.message.includes("parentNode")) {
            console.error("iOS Safari parentNode error caught - embedded content may be blocked by security policies");
          }
          
          // Swallow the error to prevent it from propagating to Sentry
        }
      } catch (e) {
        // Outer catch for any other errors during the setup process
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
      } finally {
        // Remove the global error handler after a short delay to catch any async errors
        setTimeout(() => {
          window.removeEventListener("error", globalErrorHandler, true);
        }, 500);
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
