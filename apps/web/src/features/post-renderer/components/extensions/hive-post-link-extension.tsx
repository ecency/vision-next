"use client";

import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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

  const url = useMemo(() => {
    try {
      return new URL(link, "https://ecency.com");
    } catch {
      return null;
    }
  }, [link]);
  const cacheKey = url?.pathname.toLowerCase() ?? "";

  const fetchData = useCallback(async () => {
    if (!cacheKey) return;
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
    if (!url) return link;
    const referral = url.searchParams.get("referral");
    return `${url.pathname}${referral ? `?referral=${referral}` : ""}${url.hash}`;
  }, [url, link]);

  return (
    <a
      href={enhancedHref}
      className="er-post-link-link"
      target="_blank"
      rel="noopener"
    >
      {data ? (
        <>
          <div
            className="er-post-link-link-image"
            style={{ backgroundImage: `url(${data.image})` }}
          />
          <div className="er-post-link-link-text-content">
            <div className="er-post-link-link-type">
              Hive post
            </div>
            <div className="er-post-link-link-title">
              {data.title}
            </div>
            <div className="er-post-link-link-description">
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
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);

  useEffect(() => {
    rootsRef.current.forEach(r => r.unmount());
    rootsRef.current = [];

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
        try {
          // Prevent multiple injections
          if ((element as HTMLElement).dataset.enhanced === "true") return;

          // Verify element is still connected to the DOM before manipulation
          if (!element.isConnected || !element.parentNode) {
            console.warn("Hive post link element is not connected to DOM, skipping");
            return;
          }

          (element as HTMLElement).dataset.enhanced = "true";

          const container = document.createElement("div");
          container.classList.add("er-post-link");

          const href = element.getAttribute("href") ?? "";
          const root = createRoot(container);
          rootsRef.current.push(root);
          root.render(<HivePostLinkRenderer link={href} />);

          // Final safety check before replacing
          if (element.isConnected && element.parentElement) {
            element.parentElement.replaceChild(container, element);
          }
        } catch (error) {
          console.warn("Error enhancing Hive post link element:", error);
        }
      });

    return () => {
      rootsRef.current.forEach(r => r.unmount());
      rootsRef.current = [];
    };
  }, []);

  return null;
}
