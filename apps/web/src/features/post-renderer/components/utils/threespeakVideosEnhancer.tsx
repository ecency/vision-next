import { createRoot, Root } from "react-dom/client";
import { ThreeSpeakVideoRenderer } from "../extensions";
import { injectThreeSpeakThumbnail } from "./threeSpeakThumbnail";

/**
 * DOM utility enhancer
 */
export function applyThreeSpeakVideos(container: HTMLElement, images?: string[]): Root[] {
    const roots: Root[] = [];
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-video-link-speak:not(.ecency-renderer-speak-extension)"
        )
    );

    elements.forEach((el) => {
        if (el.dataset.enhanced === "true") return;
        el.dataset.enhanced = "true";

        injectThreeSpeakThumbnail(el, images);

        const embedSrc = el.dataset.embedSrc ?? "";
        const wrapper = document.createElement("div");
        wrapper.classList.add("ecency-renderer-speak-extension-frame");

        const root = createRoot(wrapper);
        root.render(<ThreeSpeakVideoRenderer embedSrc={embedSrc} container={el} />);
        roots.push(root);

        el.appendChild(wrapper);
    });

    return roots;
}
