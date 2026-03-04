import { useEffect } from "react";
import { InstanceConfigManager } from "@/core";

interface DocumentMeta {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image";
}

function setMetaTag(
  property: string,
  content: string,
  attribute: "name" | "property" = "property"
) {
  let tag = document.querySelector(
    `meta[${attribute}="${property}"]`
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function removeMetaTag(property: string, attribute: "name" | "property" = "property") {
  const tag = document.querySelector(`meta[${attribute}="${property}"]`);
  if (tag) tag.remove();
}

/**
 * Sets document title and OG/Twitter meta tags. Restores defaults on unmount.
 */
export function useDocumentMeta(meta: DocumentMeta) {
  useEffect(() => {
    const config = InstanceConfigManager.getConfig();
    const defaultTitle = config.configuration.instanceConfiguration.meta.title || "Blog";
    const previousTitle = document.title;

    // Set title
    if (meta.title) {
      document.title = `${meta.title} — ${defaultTitle}`;
    }

    // OG tags
    if (meta.ogTitle || meta.title) {
      setMetaTag("og:title", meta.ogTitle || meta.title!);
    }
    if (meta.ogDescription || meta.description) {
      setMetaTag("og:description", meta.ogDescription || meta.description!);
    }
    if (meta.ogImage) {
      setMetaTag("og:image", meta.ogImage);
    }
    if (meta.ogType) {
      setMetaTag("og:type", meta.ogType);
    }
    if (meta.ogUrl) {
      setMetaTag("og:url", meta.ogUrl);
    }

    // Twitter card tags
    if (meta.twitterCard) {
      setMetaTag("twitter:card", meta.twitterCard, "name");
    }
    if (meta.ogTitle || meta.title) {
      setMetaTag("twitter:title", meta.ogTitle || meta.title!, "name");
    }
    if (meta.ogDescription || meta.description) {
      setMetaTag("twitter:description", meta.ogDescription || meta.description!, "name");
    }
    if (meta.ogImage) {
      setMetaTag("twitter:image", meta.ogImage, "name");
    }

    // Cleanup: restore defaults
    return () => {
      document.title = previousTitle !== meta.title ? previousTitle : defaultTitle;
      removeMetaTag("og:title");
      removeMetaTag("og:description");
      removeMetaTag("og:image");
      removeMetaTag("og:type");
      removeMetaTag("og:url");
      removeMetaTag("twitter:card", "name");
      removeMetaTag("twitter:title", "name");
      removeMetaTag("twitter:description", "name");
      removeMetaTag("twitter:image", "name");
    };
  }, [meta.title, meta.description, meta.ogTitle, meta.ogDescription, meta.ogImage, meta.ogType, meta.ogUrl, meta.twitterCard]);
}
