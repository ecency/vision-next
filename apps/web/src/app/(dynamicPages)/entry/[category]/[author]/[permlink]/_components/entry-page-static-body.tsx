import { Entry } from "@/entities";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import type { SeoContext } from "@ecency/render-helper";
import { accountReputation } from "@/utils";
import defaults from "@/defaults";

interface Props {
  entry: Entry;
}
setProxyBase(defaults.imageServer);
export function EntryPageStaticBody({ entry }: Props) {
  const seoContext: SeoContext = {
    authorReputation: accountReputation(entry.author_reputation),
    postPayout: entry.payout
  };

  return (
    <div
      id="post-body"
      className="entry-body markdown-view user-selectable client"
      itemProp="articleBody"
      dangerouslySetInnerHTML={{ __html: renderPostBody(entry.body, false, false, 'ecency.com', seoContext) }}
    />
  );
}
