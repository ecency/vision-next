"use client";

import React, { RefObject, useEffect, useMemo } from "react";
import { hydrateRoot } from "react-dom/client";
import { useQuery } from "@tanstack/react-query";
import { getPostQueryOptions } from "@ecency/sdk";
import { QueryIdentifiers } from "@/core/react-query";
import { makeEntryPath } from "@/utils";
import { findPostLinkElements, isWaveLikePost } from "../functions";
import "./wave-like-post-extension.scss";
import { EcencyRenderer } from "../ecency-renderer";
import { Logo } from "../icons";

export function WaveLikePostRenderer({ link }: { link: string }) {
  const [author, permlink] = useMemo(() => {
    const [_, __, ___, username, perm] = new URL(
      link,
      "https://ecency.com",
    ).pathname.split("/");
    return [username.replace("@", ""), perm];
  }, [link]);

  const { data: post } = useQuery({
    ...getPostQueryOptions(author, permlink),
    queryKey: [QueryIdentifiers.ENTRY, makeEntryPath("", author, permlink)],
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

  if (!post) {
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

    findPostLinkElements(container)
      .filter((el) => isWaveLikePost(el.getAttribute("href") ?? ""))
      .forEach((element) => {
        const container = document.createElement("div");
        container.classList.add("ecency-renderer-wave-like-extension");
        hydrateRoot(
          container,
          <WaveLikePostRenderer link={element.getAttribute("href") ?? ""} />,
        );
        element.parentElement?.replaceChild(container, element);
      });
  }, []);

  return <></>;
}
