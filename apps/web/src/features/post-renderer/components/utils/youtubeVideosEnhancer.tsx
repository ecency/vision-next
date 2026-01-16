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
        if (el.dataset.enhanced === "true") return;
        el.dataset.enhanced = "true";

        const embedSrc =
            el.dataset.embedSrc ||
            getYoutubeEmbedUrl(el.getAttribute("href") ?? "");
        el.dataset.embedSrc = embedSrc;
        const wrapper = document.createElement("div");
        wrapper.classList.add("ecency-renderer-youtube-extension-frame");

        const root = createRoot(wrapper);
        root.render(<YoutubeVideoRenderer embedSrc={embedSrc} container={el} />);

        el.appendChild(wrapper);
    });
}
