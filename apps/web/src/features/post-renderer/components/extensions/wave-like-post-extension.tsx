"use client";

import React, { RefObject, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useQuery, QueryClientProvider } from "@tanstack/react-query";
import { getPostQueryOptions, QueryKeys } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";
import { makeEntryPath } from "@/utils";
import { findPostLinkElements, isWaveLikePost } from "../functions";
import "./wave-like-post-extension.scss";
import { EcencyRenderer } from "../ecency-renderer";
import { Logo } from "../icons";

export function WaveLikePostRenderer({ link }: { link: string }) {
  const [author, permlink] = useMemo(() => {
    try {
      const pathname = new URL(link, "https://ecency.com").pathname;
      const segments = pathname.split("/").filter((seg) => seg.length > 0);

      // Find the index of the username segment (starts with @)
      const usernameIndex = segments.findIndex((seg) => seg.startsWith("@"));

      if (usernameIndex === -1) {
        // No @ segment found, try to find after "waves" prefix
        const wavesIndex = segments.findIndex((seg) => seg === "waves");
        if (wavesIndex !== -1 && segments.length > wavesIndex + 2) {
          const username = segments[wavesIndex + 1];
          const perm = segments[wavesIndex + 2];
          return [username.replace("@", ""), perm];
        }
        console.warn(`[WaveLikePost] Could not parse author from link: ${link}`);
        return [null, null];
      }

      // Extract author (strip @) and permlink (next segment)
      const username = segments[usernameIndex];
      const perm = segments[usernameIndex + 1];

      if (!username || !perm) {
        console.warn(`[WaveLikePost] Missing author or permlink in link: ${link}`);
        return [null, null];
      }

      return [username.replace("@", ""), perm];
    } catch (error) {
      console.error(`[WaveLikePost] Failed to parse link: ${link}`, error);
      return [null, null];
    }
  }, [link]);

  const { data: post } = useQuery({
    ...getPostQueryOptions(author ?? "", permlink ?? ""),
    queryKey: QueryKeys.posts.entry(makeEntryPath("", author ?? "", permlink ?? "")),
    enabled: !!author && !!permlink,
  });

  const host = useMemo(() => {
    if (
      post?.permlink?.startsWith("re-ecencywaves") ||
      post?.permlink?.startsWith("wave-")
    ) {
      return "ecency.waves";
    }

    if (post?.permlink?.startsWith("re-leothreads")) {
      return "threads";
    }

    if (post?.permlink?.startsWith("re-liketu-moments")) {
      return "moments";
    }

    return "";
  }, [post]);

  // Return early if link parsing failed or post not loaded
  if (!author || !permlink || !post) {
    return <></>;
  }

  const waveLink = `/waves/${post.author}/${post.permlink}`;

  return (
    <article className="ecency-renderer-wave-like-post-extension-renderer">
      <a
        href={waveLink}
        aria-label={`Open wave by @${post.author}`}
        className="ecency-renderer-wave-like-post-extension-renderer__overlay"
      />
      <div className="ecency-renderer-wave-like-post-extension-renderer--author">
        <img
          src={`https://images.ecency.com/u/${post.author}/avatar/small`}
          alt={post.author}
          className="ecency-renderer-wave-like-post-extension-renderer--author-avatar"
        />
        <div className="ecency-renderer-wave-like-post-extension-renderer--author-content">
          <a
            className="ecency-renderer-wave-like-post-extension-renderer--author-content-link"
            href={`/@${post.author}/posts`}
          >
            @{post.author}
          </a>
          <div className="ecency-renderer-wave-like-post-extension-renderer--author-content-host">
            #{host}
          </div>
        </div>
      </div>
      <a
        href="https://ecency.com"
        className="ecency-renderer-wave-like-post-extension-renderer--logo"
        dangerouslySetInnerHTML={{ __html: Logo }}
      />
      <div className="ecency-renderer-wave-like-post-extension-renderer--body">
        <EcencyRenderer value={post.body} />
      </div>
    </article>
  );
}

export function WaveLikePostExtension({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const queryClient = getQueryClient();

    findPostLinkElements(container)
      .filter((el) => isWaveLikePost(el.getAttribute("href") ?? ""))
      .forEach((element) => {
        try {
          // Verify element is still connected to the DOM before manipulation
          if (!element.isConnected || !element.parentNode) {
            console.warn("Wave-like post element is not connected to DOM, skipping");
            return;
          }

          const container = document.createElement("div");
          container.classList.add("ecency-renderer-wave-like-extension");

          // Use createRoot instead of hydrateRoot (no server-rendered content to hydrate)
          const root = createRoot(container);
          root.render(
            <QueryClientProvider client={queryClient}>
              <WaveLikePostRenderer link={element.getAttribute("href") ?? ""} />
            </QueryClientProvider>
          );

          // Final safety check before replacing
          if (element.isConnected && element.parentElement) {
            element.parentElement.replaceChild(container, element);
          }
        } catch (error) {
          console.warn("Error enhancing wave-like post element:", error);
        }
      });
  }, []);

  return <></>;
}
