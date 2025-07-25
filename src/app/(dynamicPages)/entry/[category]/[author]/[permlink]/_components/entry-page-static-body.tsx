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
      className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-2 md:p-3 entry-body markdown-view user-selectable client"
      itemProp="articleBody"
      dangerouslySetInnerHTML={{ __html: renderPostBody(entry.body, false) }}
    />
  );
}
