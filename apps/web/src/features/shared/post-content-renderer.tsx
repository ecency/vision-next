"use client";

import { EcencyRenderer } from "@/features/post-renderer";
import type { RenderOptions, SeoContext } from "@ecency/render-helper";
import { HTMLProps, memo, useCallback, useMemo, useState } from "react";
import { Tweet } from "react-tweet";
import TransactionSigner from "./transactions/transaction-signer";

const MemoizedEcencyRenderer = memo(EcencyRenderer);

interface Props {
  value: string;
  seoContext?: SeoContext;
  onTagClick?: (tag: string) => void;
  images?: string[];
  renderOptions?: RenderOptions;
}

export function PostContentRenderer({
  value,
  seoContext,
  onTagClick,
  images,
  renderOptions,
  ...props
}: Props & Omit<HTMLProps<HTMLDivElement>, "value">) {
  const [signingOperation, setSigningOperation] = useState<string>();
  const stableRenderOptions = useMemo(() => renderOptions, [renderOptions?.embedVideosDirectly]);

  const handleHiveOperationClick = useCallback((e: string) => setSigningOperation(e), []);

  const { onClick, ...restProps } = props;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (onTagClick) {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest<HTMLAnchorElement>(
          ".markdown-tag-link, .er-tag-link"
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
        images={images}
        renderOptions={stableRenderOptions}
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
