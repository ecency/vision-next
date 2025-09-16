import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Editor } from "@tiptap/core";
import { useEffect } from "react";
import { usePublishState } from "./use-publish-state";

export function usePublishLinksAttach(editor: Editor | null) {
  const { postLinks, setPostLinks } = usePublishState();

  // Collect all available attached post links
  return useEffect(() => {
    editor?.on("update", () => {
      editor
        .$nodes("hivePost")
        ?.map((node) => {
          const { href } = node.attributes;
          const entryUrl = new URL(href);
          const [_, __, author, permlink] = entryUrl.pathname.split("/");
          return [author, permlink] as const;
        })
        ?.filter(([author, permlink]) =>
          postLinks?.every(
            (post) =>
              author !== post?.author || permlink !== post?.permlink
          )
        )
        ?.forEach(async ([author, permlink]) => {
          const query = EcencyEntriesCacheManagement.getEntryQueryByPath(
            author.replace("@", "").replace("%40", ""),
            permlink
          );

          let entryData = query.getData();
          if (!entryData) {
            await query.prefetch();
            entryData = query.getData();
          }
          setPostLinks([
            ...(postLinks?.filter(
              (post) =>
                post?.author !== entryData?.author ||
                post?.permlink !== entryData?.permlink
            ) ?? []),
            entryData!
          ]);
        });
    });
  }, [editor]);
}
