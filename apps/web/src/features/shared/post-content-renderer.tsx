"use client";

import { EcencyRenderer } from "@/features/post-renderer";
import type { SeoContext } from "@ecency/render-helper";
import { HTMLProps, memo, useCallback, useState } from "react";
import { Tweet } from "react-tweet";
import TransactionSigner from "./transactions/transaction-signer";

const MemoizedEcencyRenderer = memo(EcencyRenderer);

interface Props {
  value: string;
  seoContext?: SeoContext;
  onTagClick?: (tag: string) => void;
}

export function PostContentRenderer({
  value,
  seoContext,
  onTagClick,
  ...props
}: Props & Omit<HTMLProps<HTMLDivElement>, "value">) {
  const [signingOperation, setSigningOperation] = useState<string>();

  const handleHiveOperationClick = useCallback((e: string) => setSigningOperation(e), []);

  const { onClick, ...restProps } = props;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (onTagClick) {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest<HTMLAnchorElement>(
          ".markdown-tag-link, .ecency-renderer-tag-extension-link"
        );

        if (anchor) {
          event.preventDefault();
          event.stopPropagation();

          const textTag = anchor.textContent?.trim() ?? "";
          const hrefTag = anchor.getAttribute("href") ?? "";

          let resolvedTag = textTag.replace(/^#+/, "").replace(/\s+/g, "");

          if (!resolvedTag) {
            try {
              const url = new URL(
                hrefTag,
                typeof window === "undefined" ? "https://ecency.com" : window.location.origin
              );
              const segments = url.pathname.split("/").filter(Boolean);
              resolvedTag = segments.pop() ?? "";
            } catch (err) {
              resolvedTag = hrefTag.replace(/^#+/, "").replace(/\s+/g, "");
            }
          }

          const normalizedTag = resolvedTag.replace(/^#+/, "").replace(/\s+/g, "");

          if (normalizedTag) {
            onTagClick(normalizedTag.toLowerCase());
          }
        }
      }

      onClick?.(event);
    },
    [onClick, onTagClick]
  );

  return (
    <>
      <MemoizedEcencyRenderer
        value={value || ""}
        seoContext={seoContext}
        {...(restProps as any)}
        onClick={handleClick}
        onHiveOperationClick={handleHiveOperationClick}
        TwitterComponent={Tweet}
      />
      <TransactionSigner
        show={!!signingOperation}
        onHide={() => setSigningOperation(undefined)}
        operation={signingOperation}
      />
    </>
  );
}
