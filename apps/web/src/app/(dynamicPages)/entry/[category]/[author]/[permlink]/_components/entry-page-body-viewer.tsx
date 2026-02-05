"use client";

import { Entry } from "@/entities";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@/features/post-renderer";
import dynamic from "next/dynamic";
import { useContext, useEffect, useState } from "react";
import TransactionSigner from "@/features/shared/transactions/transaction-signer";
import { EntryPageContext } from "./context";
import { EntryPageEdit } from "./entry-page-edit";
import { makeEntryPath } from "@/utils";

// Twitter embed component with error handling for ChunkLoadError
const Tweet = dynamic(
  () =>
    import("react-tweet")
      .then((m) => m.Tweet)
      .catch((error) => {
        // Handle ChunkLoadError gracefully (network issues, CDN problems, iOS Safari strict policies)
        console.error("Failed to load react-tweet component:", error);
        // Return a proper fallback component
        return {
          default: ({ id }: { id: string }) => (
            <div
              style={{
                padding: "16px",
                border: "1px solid #e1e8ed",
                borderRadius: "8px",
                backgroundColor: "#f7f9fa",
                color: "#657786",
                textAlign: "center",
              }}
            >
              Failed to load tweet. View on Twitter:{" "}
              <a
                href={`https://twitter.com/i/status/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1da1f2" }}
              >
                https://twitter.com/i/status/{id}
              </a>
            </div>
          ),
        };
      }),
  {
    ssr: false,
  }
);

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
    let cleanup: (() => void) | null = null;
    const timer = setTimeout(() => {
      try {
        // Re-verify the element is still safe before proceeding
        if (!isElementSafe(el)) {
          console.warn("Post body element is not safely accessible, skipping enhancements");
          return;
        }

        cleanup = setupPostEnhancements(el, {
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

    return () => {
      clearTimeout(timer);
      cleanup?.();
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
