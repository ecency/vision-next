"use client";

import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import "./hive-post-link-extension.scss";
import { findPostLinkElements, isWaveLikePost } from "../functions";

// In-memory session cache
const simpleCache = new Map<
  string,
  {
    title: string;
    description: string | undefined;
    image: string | undefined;
  }
>();

function isInvalidPermlinkLink(path: string): boolean {
  try {
    const parts = new URL(`https://ecency.com${path}`).pathname.split("/");
    const permlink = decodeURIComponent(parts[3] || "");

    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(permlink);
    const hasBadChars = /[?#]/.test(permlink);
    const isClean = /^[a-z0-9-]+$/.test(permlink); // Hive-style

    return !isClean || isImage || hasBadChars;
  } catch {
    return true;
  }
}

export function HivePostLinkRenderer({ link }: { link: string }) {
  const [data, setData] = useState<{
    title: string;
    description?: string;
    image?: string;
  }>();

  const url = useMemo(() => new URL(link, "https://ecency.com"), [link]);
  const cacheKey = url.pathname.toLowerCase();

  const fetchData = useCallback(async () => {
    if (simpleCache.has(cacheKey)) {
      setData(simpleCache.get(cacheKey));
      return;
    }
    if (isInvalidPermlinkLink(cacheKey)) {
      console.warn("[Ecency Renderer] Skipping invalid post link:", cacheKey);
      return;
    }

    try {
      const response = await fetch(`https://ecency.com${cacheKey}`, {
        method: "GET",
      });
      const raw = await response.text();
      const pageDOM = document.createElement("html");
      pageDOM.innerHTML = raw;

      const rawTitle = pageDOM
        .querySelector(`meta[property="og:title"]`)
        ?.getAttribute("content");

      if (rawTitle) {
        const preview = {
          title: rawTitle,
          description:
            pageDOM
              .querySelector(`meta[property="og:description"]`)
              ?.getAttribute("content")
              ?.substring(0, 71) ?? undefined,
          image:
            pageDOM
              .querySelector(`meta[property="og:image"]`)
              ?.getAttribute("content") ?? undefined,
        };

        simpleCache.set(cacheKey, preview);
        setData(preview);
      }
    } catch (e) {
      console.error(`[Ecency Renderer] Failed to fetch preview: ${link}`, e);
    }
  }, [cacheKey, link]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enhancedHref = useMemo(() => {
    const u = new URL(url.href);
    const referral = u.searchParams.get("referral");
    return `${u.pathname}${referral ? `?referral=${referral}` : ""}${u.hash}`;
  }, [url]);

  return (
    <a
      href={enhancedHref}
      className="ecency-renderer-hive-post-extension-link"
      target="_blank"
      rel="noopener"
    >
      {data ? (
        <>
          <div
            className="ecency-renderer-hive-post-extension-link-image"
            style={{ backgroundImage: `url(${data.image})` }}
          />
          <div className="ecency-renderer-hive-post-extension-link-text-content">
            <div className="ecency-renderer-hive-post-extension-link-type">
              Hive post
            </div>
            <div className="ecency-renderer-hive-post-extension-link-title">
              {data.title}
            </div>
            <div className="ecency-renderer-hive-post-extension-link-description">
              {data.description + "..."}
            </div>
          </div>
        </>
      ) : (
        link
      )}
    </a>
  );
}

export function HivePostLinkExtension({
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
      .filter((el) => !isWaveLikePost(el.getAttribute("href") ?? ""))
      .filter((el) => {
        try {
          const url = new URL(
            el.getAttribute("href") ?? "",
            "https://ecency.com",
          );
          return !isInvalidPermlinkLink(url.pathname);
        } catch {
          return false;
        }
      })
      .forEach((element) => {
        // Prevent multiple injections
        if ((element as HTMLElement).dataset.enhanced === "true") return;
        (element as HTMLElement).dataset.enhanced = "true";

        const container = document.createElement("div");
        container.classList.add("ecency-renderer-hive-post-extension");

        const href = element.getAttribute("href") ?? "";
        const root = createRoot(container);
        root.render(<HivePostLinkRenderer link={href} />);

        element.parentElement?.replaceChild(container, element);
      });
  }, []);

  return null;
}
