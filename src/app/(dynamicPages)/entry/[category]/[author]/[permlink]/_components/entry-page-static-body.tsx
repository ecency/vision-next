import { Entry } from "@/entities";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import defaults from "@/defaults.json";

interface Props {
  entry: Entry;
}
setProxyBase(defaults.imageServer);
export function EntryPageStaticBody({ entry }: Props) {
  return (
    <div
      id="post-body"
      className="entry-body markdown-view user-selectable client"
      itemProp="articleBody"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: renderPostBody(entry.body, false) }}
    />
  );
}
