import { Entry } from "@/entities";
import { renderPostBody } from "@ecency/render-helper";

interface Props {
    entry: Entry;
}

export function EntryPageStaticBody({ entry }: Props) {
    return (
        <div
            id="post-body"
            className="entry-body markdown-view user-selectable client"
            itemProp="articleBody"
            dangerouslySetInnerHTML={{ __html: renderPostBody(entry.body, false) }}
        />
    );
}
