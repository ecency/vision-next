import React, { useEffect, useMemo, useState } from "react";
import { Entry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { EntryLink } from "@/features/shared";
import { buildSrcSet, getEntryCardImageRawUrl, proxifyImageSrc } from "@ecency/render-helper";
import { catchPostImageSafely } from "@/core/entries/catch-post-image-safely";
import Image from "next/image";
import { THUMB_SIZES } from "./thumb-lcp";

interface Props {
  entry: Entry;
  noImage: string;
  isCrossPost: boolean;
  entryProp: Entry;
  // First above-the-fold item(s): render the thumbnail eagerly with high fetch
  // priority so it can be the LCP without waiting behind lazy images.
  isThumbLcp?: boolean;
}

export function EntryListItemThumbnail({
  entry,
  noImage,
  isCrossPost,
  entryProp,
  isThumbLcp = false
}: Props) {
  const listStyle = useGlobalStore((state) => state.listStyle);
  const isGrid = listStyle === "grid";

  // Proxied thumbnail URL computed SYNCHRONOUSLY (no client blob fetch), so the
  // <img src>/<srcset> lands in the server HTML and the browser can discover and
  // start the LCP image at parse time. catchPostImage already returns a fully
  // proxified i.ecency.com URL — the same path post-body/cover images use — so
  // the old useImageDownloader blob→base64 round-trip (which gated this behind
  // JS download + hydration) is not needed.
  // catchPostImageSafely, not catchPostImage: this runs during the SSR render
  // of every feed row, with no boundary above it, and the extractor can throw on
  // an author-crafted body. A throw degrades to "no thumbnail" (the noImage
  // placeholder) instead of taking the page down.
  const src = useMemo(() => catchPostImageSafely(entry, 600, 500, "match") || null, [entry]);

  // The image host passes ANIMATED gifs through untransformed — it decides from
  // the decoded frame count (`metadata.pages > 1`) and skips the resize, because
  // sharp can strip frames even in animated mode. Width, height, blur and format
  // are all ignored for those, so every variant is the original file: verified
  // against the 1.5 MB GIF that is the current LCP element on /trending, where
  // ?width=320, ?width=600&height=500, ?blur=1 and ?format=webp each returned
  // the same 1,572,008 bytes.
  //
  // The cost that matters is the LQIP placeholder: it is a SECOND request for a
  // file the host will not shrink, so a card with an animated GIF cover pulled
  // 3.1 MB for a 150px slot. Skip it. `srcSet` stays, because it costs nothing
  // either way — the browser picks exactly one candidate, and for a STATIC gif
  // (which the host does resize) those candidates are real.
  //
  // The extension is all we have client-side; animation is only knowable after
  // decoding. So a static gif loses its blur preview, which is cosmetic, while
  // an animated one stops double-downloading, which is 1.5 MB. See #1802 for
  // the host-side half.
  const isPassthroughSource = useMemo(() => {
    // Card precedence, NOT getEntryImageRawUrl: that one skips
    // json_metadata.thumbnails on purpose, so it can name a different file than
    // the one this card renders.
    const raw = getEntryCardImageRawUrl(entry);
    return !!raw && /\.gif(?:[?#]|$)/i.test(raw);
  }, [entry]);

  const srcSet = useMemo(() => (src ? buildSrcSet(src) : ""), [src]);

  const blurUrl = useMemo(() => {
    if (isPassthroughSource) return null;
    const url = catchPostImageSafely(entry, 0, 0);
    if (!url) return null;
    // Route the LQIP placeholder through the /p/ proxy so `blur=1` is honored.
    // Appending `?blur=1` to a bare upload URL hits the direct-serve route,
    // which ignores the param and returns the full-resolution image.
    return proxifyImageSrc(url, 0, 0, "match", { blur: true }) || null;
  }, [entry, isPassthroughSource]);

  // Loop-safe one-shot fallback to the noImage placeholder. This preserves what
  // the old query's try/catch did (swap to noImage on a failed load) without the
  // request loop a naive onError can cause: once we've fallen back we never
  // re-assign src. Reset when the row is reused for a different entry.
  const [errored, setErrored] = useState(false);
  useEffect(() => setErrored(false), [entry.author, entry.permlink]);

  const hasFullImage = !!src && !errored;
  const displaySrc = hasFullImage ? (src as string) : noImage;

  const showImage = useMemo(() => {
    const isComment = !!entry.parent_permlink && entry.parent_permlink !== entry.permlink;
    return !isComment || !!src;
  }, [entry.parent_permlink, entry.permlink, src]);

  return (
    showImage && (
      <div className={"item-image " + (!hasFullImage ? "noImage" : "")}>
        <EntryLink className="h-full" entry={isCrossPost ? entryProp : entry}>
          <div className="h-full w-full relative overflow-hidden">
            {/* LQIP placeholder behind the real image; the real image (opaque on
                load) covers it. Kept fully visible so it never gates the LCP
                paint on JS. */}
            {blurUrl && hasFullImage && (
              <img
                src={blurUrl}
                alt=""
                aria-hidden="true"
                // Lazy for every card the reader has not scrolled to, and the
                // attribute is load-bearing rather than cosmetic: React hoists a
                // <link rel=preload as=image> into <head> for each EAGER <img> it
                // renders in the shell, and this layer has one per card. While the
                // feed sat behind a loading.tsx boundary those links were held back
                // with it; #1786 put the cards in the shell, which released ~21 blur
                // preloads into <head> on a 20-card feed, all of them competing with
                // the real LCP image on a throttled link. The two eager cards keep
                // an eager placeholder so their paint is still instant.
                loading={isThumbLcp ? "eager" : "lazy"}
                decoding={isThumbLcp ? undefined : "async"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {isGrid ? (
              <Image
                width={1000}
                height={1000}
                className="w-full h-full object-cover mx-auto relative"
                src={displaySrc}
                alt={entry.title}
                priority={isThumbLcp}
                onError={() => setErrored(true)}
              />
            ) : (
              <img
                className="w-full relative"
                src={displaySrc}
                srcSet={hasFullImage && srcSet ? srcSet : undefined}
                sizes={hasFullImage && srcSet ? THUMB_SIZES : undefined}
                alt={entry.title}
                loading={isThumbLcp ? "eager" : "lazy"}
                fetchPriority={isThumbLcp ? "high" : undefined}
                decoding={isThumbLcp ? undefined : "async"}
                onError={() => setErrored(true)}
              />
            )}
          </div>
        </EntryLink>
      </div>
    )
  );
}
