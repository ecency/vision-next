import { createRoot } from "react-dom/client";
import { ThreeSpeakVideoRenderer } from "../extensions";

/**
 * DOM utility enhancer
 */
export function applyThreeSpeakVideos(container: HTMLElement) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-video-link-speak:not(.ecency-renderer-speak-extension)"
        )
    );

    elements.forEach((el) => {
        if (el.dataset.enhanced === "true") return;
        el.dataset.enhanced = "true";

        const embedSrc = el.dataset.embedSrc ?? "";
        const wrapper = document.createElement("div");
        wrapper.classList.add("ecency-renderer-speak-extension-frame");

        const root = createRoot(wrapper);
        root.render(<ThreeSpeakVideoRenderer embedSrc={embedSrc} container={el} />);

        el.appendChild(wrapper);
    });
}
