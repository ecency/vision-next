import { Entry } from "@/entities";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import defaults from "@/defaults.json";

interface Props {
  entry: Entry;
}

setProxyBase(defaults.imageServer);

export function EntryPageSSRBody({ entry }: Props) {
  // For SSR, we use a consistent default value for canUseWebp to avoid hydration mismatches
  // The client-side component will re-render with the correct value
  return (
    <div
      id="post-body"
      className="entry-body markdown-view user-selectable client"
      itemProp="articleBody"
      dangerouslySetInnerHTML={{ __html: renderPostBody(entry.body, false, false) }}
    />
  );
}