import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Entry } from "@/entities";
import { Editor } from "@tiptap/core";
import { useEffect, useRef } from "react";
import { usePublishState } from "./use-publish-state";
import { getQueryClient } from "@/core/react-query";

function parseEntryFromHref(href: string): readonly [string, string] | undefined {
  try {
    const base = href.startsWith("http") ? undefined : "https://ecency.com";
    const entryUrl = new URL(href, base);
    const segments = entryUrl.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return undefined;
    }

    const [authorSegment, permlink] = segments.slice(-2);
    if (!authorSegment || !permlink) {
      return undefined;
    }

    const author = authorSegment.replace(/^@/, "").replace(/%40/gi, "");

    return [author, permlink] as const;
  } catch {
    return undefined;
  }
}

export function usePublishLinksAttach(editor: Editor | null) {
  const { postLinks, setPostLinks } = usePublishState();
  const postLinksRef = useRef(postLinks ?? []);

  useEffect(() => {
    postLinksRef.current = postLinks ?? [];
  }, [postLinks]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    let destroyed = false;

    const syncAttachedPosts = async () => {
      const nodes = editor.$nodes("hivePost") ?? [];
      const attachments = nodes
        .map((node) => parseEntryFromHref(node.attributes.href))
        .filter(Boolean) as Array<readonly [string, string]>;

      const seen = new Set<string>();
      const uniqueAttachments = attachments.filter(([author, permlink]) => {
        const key = `${author}/${permlink}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      const previous = postLinksRef.current ?? [];
      const previousMap = new Map(
        previous.map((post) => [`${post?.author}/${post?.permlink}`, post])
      );

      const entries = await Promise.all(
        uniqueAttachments.map(async ([author, permlink]) => {
          const key = `${author}/${permlink}`;
          const existing = previousMap.get(key);
          if (existing) {
            return existing;
          }

          const queryOptions = EcencyEntriesCacheManagement.getEntryQueryByPath(
            author,
            permlink
          );

          const qc = getQueryClient();
          let entryData = qc.getQueryData<Entry>(queryOptions.queryKey);
          if (!entryData) {
            try {
              await qc.fetchQuery(queryOptions);
              entryData = qc.getQueryData<Entry>(queryOptions.queryKey);
            } catch {
              // The linked post could not be loaded (deleted, bad permlink, or
              // an RPC node that throws "Post does not exist" instead of
              // returning null). Skip this attachment instead of rejecting the
              // whole sync, which would surface as an unhandled rejection.
              return null;
            }
          }

          return entryData ?? null;
        })
      );

      if (destroyed) {
        return;
      }

      const nextLinks = entries.filter((entry): entry is Entry => entry != null);

      const isSame =
        nextLinks.length === previous.length &&
        nextLinks.every((entry, index) => {
          const prev = previous[index];
          return (
            prev?.author === entry.author && prev?.permlink === entry.permlink
          );
        });

      if (isSame) {
        return;
      }

      postLinksRef.current = nextLinks;
      setPostLinks(nextLinks);
    };

    const runSync = () => {
      // Expected per-link lookup failures are handled inside syncAttachedPosts.
      // Anything that still rejects here is unexpected: keep it non-throwing
      // (so it never becomes an unhandled rejection) but log it for visibility.
      void syncAttachedPosts().catch((err) => {
        console.error("Failed to sync attached posts", err);
      });
    };

    editor.on("update", runSync);
    runSync();

    return () => {
      destroyed = true;
      editor.off("update", runSync);
    };
  }, [editor, setPostLinks]);
}
