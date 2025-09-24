import { Entry } from "@/entities";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import { sanitizePostBody } from "@/utils/sanitize-content";
import defaults from "@/defaults.json";

interface Props {
  entry: Entry;
}
setProxyBase(defaults.imageServer);
export function EntryPageStaticBody({ entry }: Props) {
  const renderedContent = renderPostBody(entry.body, false);
  const sanitizedContent = sanitizePostBody(renderedContent);
  
  return (
    <div
      id="post-body"
      className="entry-body markdown-view user-selectable client"
      itemProp="articleBody"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
