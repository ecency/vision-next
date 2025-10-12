import { createRoot } from "react-dom/client";
import React from "react";

/**
 * Utility to enhance Twitter links with embedded tweets
 */
export function applyTwitterEmbeds(
    container: HTMLElement,
    ComponentInstance: React.FC<{ id: string }>
) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-external-link"
        )
    ).filter((el) => {
        const href = el.getAttribute("href") || "";
        if (!href.startsWith("https://x.com") && !href.startsWith("https://twitter.com")) {
            return false;
        }

        try {
            const url = new URL(href);
            const parts = url.pathname.split("/").filter(Boolean);
            // Must look like /{username}/status/{tweetId}[/*]
            return (
                parts.length >= 3 &&
                parts[1] === "status" &&
                /^\d+$/.test(parts[2])
            );
        } catch {
            return false;
        }
    });

    elements.forEach((el) => {
        try {
            if (el.dataset.enhanced === "true") return;
            el.dataset.enhanced = "true";

            const href = el.getAttribute("href");
            if (!href) return;

            const url = new URL(href);
            const parts = url.pathname.split("/").filter(Boolean);
            const tweetId = parts[2]; // safe because of filter check
            if (!tweetId) return;

            const wrapper = document.createElement("div");
            wrapper.classList.add("ecency-renderer-twitter-extension-frame");

            el.innerHTML = ""; // clear existing link text
            el.appendChild(wrapper);

            const root = createRoot(wrapper);
            root.render(<ComponentInstance id={tweetId} />);
        } catch (e) {
            console.warn("applyTwitterEmbeds failed to render tweet:", e);
        }
    });
}
