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

    // iOS Safari specific DOM protection wrapper
    const safeSetupPostEnhancements = (element: HTMLElement, options: any) => {
      try {
        // Pre-scan for potentially problematic elements (iframes, embeds) that might cause cross-origin issues
        const iframes = element.querySelectorAll('iframe');
        const embeds = element.querySelectorAll('embed, object');
        
        if (iframes.length > 0 || embeds.length > 0) {
          console.log(`Found ${iframes.length} iframes and ${embeds.length} embeds - applying enhanced iOS Safari protections`);
          
          // Detect iOS Safari
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          
          if (isIOS && isSafari) {
            // Apply iOS Safari specific protections
            return setupPostEnhancementsWithIOSProtection(element, options);
          }
        }
        
        // Standard setup for other browsers or when no problematic elements are detected
        setupPostEnhancements(element, options);
        
      } catch (error) {
        // Re-throw to be handled by outer catch block
        throw error;
      }
    };

    // iOS Safari specific enhancement setup with cross-origin protection
    const setupPostEnhancementsWithIOSProtection = (element: HTMLElement, options: any) => {
      // Store original DOM methods
      const originalQuerySelector = element.querySelector.bind(element);
      const originalQuerySelectorAll = element.querySelectorAll.bind(element);
      
      // Create safer versions of DOM access methods
      const safeQuerySelector = function(selector: string): Element | null {
        try {
          const result = originalQuerySelector(selector);
          if (result) {
            // Test if we can safely access the element's parentNode
            try {
              const _ = result.parentNode;
              return result;
            } catch (securityError) {
              console.warn('Element filtered out due to cross-origin restrictions:', selector);
              return null;
            }
          }
          return result;
        } catch (error) {
          console.warn('querySelector blocked due to cross-origin restrictions:', selector, error);
          return null;
        }
      };
      
      const safeQuerySelectorAll = function(selector: string): NodeListOf<Element> {
        try {
          const results = originalQuerySelectorAll(selector);
          // Filter out elements that might cause cross-origin issues
          const safeResults = Array.from(results).filter(el => {
            try {
              // Test if we can safely access the element
              const _ = el.parentNode;
              return true;
            } catch (securityError) {
              console.warn('Element filtered out due to cross-origin restrictions');
              return false;
            }
          });
          
          // Return a NodeList-like object
          return safeResults as any;
        } catch (error) {
          console.warn('querySelectorAll blocked due to cross-origin restrictions:', selector, error);
          return [] as any;
        }
      };
      
      // Temporarily replace the DOM methods
      element.querySelector = safeQuerySelector as any;
      element.querySelectorAll = safeQuerySelectorAll as any;
      
      try {
        setupPostEnhancements(element, options);
      } finally {
        // Always restore original methods
        element.querySelector = originalQuerySelector as any;
        element.querySelectorAll = originalQuerySelectorAll as any;
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

        safeSetupPostEnhancements(el, {
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
          } else if (e.message.includes("null is not an object")) {
            console.error("iOS Safari cross-origin security error detected - iframe embeds may be restricted");
          }
        } else if (e instanceof Error && e.name === "SecurityError") {
          console.error("Cross-origin security error detected - this is common on iOS Safari with iframe embeds");
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
