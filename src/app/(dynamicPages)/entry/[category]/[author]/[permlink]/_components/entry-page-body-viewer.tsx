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

    if (!el || !el.parentNode) {
      return;
    }

    // Add a small delay to ensure DOM is fully rendered and stable
    const timer = setTimeout(() => {
      try {
        // Verify the element still exists and is properly attached to the DOM
        if (!el.isConnected || !el.parentNode) {
          console.warn("Post body element is not properly connected to DOM, skipping enhancements");
          return;
        }

        // Create a safer wrapper around setupPostEnhancements to handle DOM race conditions
        const safeSetupPostEnhancements = () => {
          // Store original DOM methods that might be problematic during enhancement
          const originalRemoveChild = Node.prototype.removeChild;
          const originalAppendChild = Node.prototype.appendChild;
          const originalInsertBefore = Node.prototype.insertBefore;
          const originalReplaceChild = Node.prototype.replaceChild;
          
          // Track if enhancement is active to prevent operations after cleanup
          let enhancementActive = true;
          
          // Safe wrapper for DOM operations that checks for null parentNode
          const safeNodeOperation = (operation: () => any, context: string, node?: Node) => {
            try {
              if (!enhancementActive) {
                console.debug(`Skipping ${context} - enhancement no longer active`);
                return null;
              }
              return operation();
            } catch (e) {
              if (e instanceof TypeError && (e.message.includes("parentNode") || e.message.includes("null"))) {
                console.warn(`Prevented ${context} operation on detached node:`, e.message);
                // Log additional context for debugging specific posts
                if (entry.permlink) {
                  console.debug(`Post context: ${entry.author}/${entry.permlink}`);
                }
                return null;
              }
              throw e;
            }
          };

          // Patch DOM methods with null-safety checks
          Node.prototype.removeChild = function(child) {
            return safeNodeOperation(() => {
              if (this && child && child.parentNode === this) {
                return originalRemoveChild.call(this, child);
              }
              console.debug("Prevented removeChild on detached or mismatched node");
              return null;
            }, "removeChild", child);
          };

          Node.prototype.appendChild = function(child) {
            return safeNodeOperation(() => {
              if (this && child) {
                return originalAppendChild.call(this, child);
              }
              console.debug("Prevented appendChild on null node");
              return child;
            }, "appendChild", child);
          };

          Node.prototype.insertBefore = function(newNode, referenceNode) {
            return safeNodeOperation(() => {
              if (this && newNode) {
                return originalInsertBefore.call(this, newNode, referenceNode);
              }
              console.debug("Prevented insertBefore on null node");
              return newNode;
            }, "insertBefore", newNode);
          };

          Node.prototype.replaceChild = function(newChild, oldChild) {
            return safeNodeOperation(() => {
              if (this && newChild && oldChild && oldChild.parentNode === this) {
                return originalReplaceChild.call(this, newChild, oldChild);
              }
              console.debug("Prevented replaceChild on detached or mismatched node");
              return oldChild;
            }, "replaceChild", oldChild);
          };

          try {
            // Final verification before enhancement
            if (!el.isConnected || !el.parentNode) {
              console.warn("Element disconnected just before enhancement, aborting");
              return;
            }

            setupPostEnhancements(el, {
              onHiveOperationClick: (op) => {
                setSigningOperation(op);
              },
              TwitterComponent: Tweet,
            });

            console.debug("Post enhancements setup completed successfully");
          } finally {
            // Always restore original methods to prevent memory leaks and side effects
            enhancementActive = false;
            Node.prototype.removeChild = originalRemoveChild;
            Node.prototype.appendChild = originalAppendChild;
            Node.prototype.insertBefore = originalInsertBefore;
            Node.prototype.replaceChild = originalReplaceChild;
          }
        };

        safeSetupPostEnhancements();
      } catch (e) {
        // Avoid breaking the page if enhancements fail, e.g. due to missing embeds or DOM structure issues
        console.error("Failed to setup post enhancements", e);
        
        // Enhanced logging for debugging with post context
        if (e instanceof TypeError && e.message.includes("parentNode")) {
          console.error("DOM structure issue detected - element may have been modified or removed during enhancement setup");
          console.error("Post details:", {
            author: entry.author,
            permlink: entry.permlink,
            category: entry.category,
            timestamp: new Date().toISOString()
          });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isRawContent, isEdit, editHistory, entry.author, entry.permlink, entry.category]);

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
