"use client";

import React, { RefObject, useEffect, useMemo, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { findPostLinkElements, isWaveLikePost } from "../functions";
import { getCachedPost } from "../../api";
import { Entry } from "@ecency/render-helper/lib/types";
import "./wave-like-post-extension.scss";
import { EcencyRenderer } from "../ecency-renderer";
import { Logo } from "../icons";

export function WaveLikePostRenderer({ link }: { link: string }) {
  const [post, setPost] = useState<Entry & { title: string }>();

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

  useEffect(() => {
    const [_, __, ___, username, permlink] = new URL(
      `https://ecency.com/${link}`,
    ).pathname.split("/");
    getCachedPost(username.replace("@", ""), permlink)
      .then((resp) => {
        setPost(resp as any);
      })
      .catch((e) => console.error(e));
  }, []);

  return post ? (
    <a
      href={`/waves/${post.author}/${post.permlink}`}
      className="ecency-renderer-wave-like-post-extension-renderer"
    >
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
        <a
          href="https://ecency.com"
          className="ecency-renderer-wave-like-post-extension-renderer--logo"
          dangerouslySetInnerHTML={{ __html: Logo }}
        />
      </div>
      <div className="ecency-renderer-wave-like-post-extension-renderer--body">
        <EcencyRenderer value={post.body} />
      </div>
    </a>
  ) : (
    <></>
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
