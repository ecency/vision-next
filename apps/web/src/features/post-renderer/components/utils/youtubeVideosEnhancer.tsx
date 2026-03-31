import { createRoot, Root } from "react-dom/client";
import { YoutubeVideoRenderer } from "../extensions";
import { getYoutubeEmbedUrl } from "./getYoutubeEmbedUrl";

/**
 * DOM utility enhancer
 */
export function applyYoutubeVideos(container: HTMLElement): Root[] {
    const roots: Root[] = [];
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-video-link-youtube:not(.er-youtube)"
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
        wrapper.classList.add("er-youtube-frame");

        const root = createRoot(wrapper);
        root.render(<YoutubeVideoRenderer embedSrc={embedSrc} container={el} />);
        roots.push(root);

        el.appendChild(wrapper);
    });

    return roots;
}
