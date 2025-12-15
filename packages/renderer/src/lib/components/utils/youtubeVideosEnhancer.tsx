import { createRoot } from "react-dom/client";
import { YoutubeVideoRenderer } from "../extensions";
import { getYoutubeEmbedUrl } from "./getYoutubeEmbedUrl";

/**
 * DOM utility enhancer
 */
export function applyYoutubeVideos(container: HTMLElement) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-video-link-youtube:not(.ecency-renderer-youtube-extension)"
        )
    );

    elements.forEach((el) => {
        try {
            if (el.dataset.enhanced === "true") return;
            el.dataset.enhanced = "true";

            // Verify element is still connected to the DOM
            if (!el.isConnected) {
                console.warn("YouTube video element is no longer connected to DOM, skipping");
                return;
            }

            const embedSrc =
                el.dataset.embedSrc ||
                getYoutubeEmbedUrl(el.getAttribute("href") ?? "");
            el.dataset.embedSrc = embedSrc;
            const wrapper = document.createElement("div");
            wrapper.classList.add("ecency-renderer-youtube-extension-frame");

            const root = createRoot(wrapper);
            root.render(<YoutubeVideoRenderer embedSrc={embedSrc} container={el} />);

            // Final check before appending - ensure element is still in DOM
            if (el.isConnected) {
                el.appendChild(wrapper);
            }
        } catch (error) {
            // Handle any errors during DOM manipulation gracefully
            console.warn("Error enhancing YouTube video element:", error);
        }
    });
}
