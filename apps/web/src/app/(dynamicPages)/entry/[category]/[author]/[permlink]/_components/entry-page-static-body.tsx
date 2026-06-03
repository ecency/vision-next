import { Entry } from "@/entities";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import type { SeoContext } from "@ecency/render-helper";
import { accountReputation } from "@/utils";
import defaults from "@/defaults";
import type { CSSProperties } from "react";

interface Props {
  entry: Entry;
}
setProxyBase(defaults.imageServer);
export function EntryPageStaticBody({ entry }: Props) {
  const seoContext: SeoContext = {
    authorReputation: accountReputation(entry.author_reputation),
    postPayout: entry.payout
  };

  // Reserve the cover (LCP) image's box to prevent the body reflowing when it
  // loads (CLS). The editor records the cover's aspect ratio at publish time in
  // json_metadata.image_ratios[0] (aligned with the cover image[0]). We expose
  // it as a CSS custom property on #post-body; an entry.scss rule applies it to
  // the cover via its fetchpriority="high" hint. This deliberately stays out of
  // the sanitized body HTML — the renderer's attribute whitelist is unchanged.
  // Posts without a recorded ratio leave the property unset → the rule no-ops.
  const meta = entry.json_metadata as { image_ratios?: (string | number)[] } | undefined;
  const coverRatio = Number(meta?.image_ratios?.[0]);
  const coverStyle =
    Number.isFinite(coverRatio) && coverRatio > 0
      ? ({ "--cover-ar": String(coverRatio), "--cover-w": "100%" } as CSSProperties)
      : undefined;

  return (
    <div
      id="post-body"
      className="entry-body markdown-view user-selectable client"
      style={coverStyle}
      dangerouslySetInnerHTML={{
        __html: renderPostBody(entry.body, false, false, "ecency.com", seoContext)
      }}
    />
  );
}
