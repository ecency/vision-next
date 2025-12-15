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
        try {
            if (el.dataset.enhanced === "true") return;
            el.dataset.enhanced = "true";

            // Verify element is still connected to the DOM
            if (!el.isConnected) {
                console.warn("3Speak video element is no longer connected to DOM, skipping");
                return;
            }

            const embedSrc = el.dataset.embedSrc ?? "";
            const wrapper = document.createElement("div");
            wrapper.classList.add("ecency-renderer-speak-extension-frame");

            const root = createRoot(wrapper);
            root.render(<ThreeSpeakVideoRenderer embedSrc={embedSrc} container={el} />);

            // Final check before appending - ensure element is still in DOM
            if (el.isConnected) {
                el.appendChild(wrapper);
            }
        } catch (error) {
            // Handle any errors during DOM manipulation gracefully
            console.warn("Error enhancing 3Speak video element:", error);
        }
    });
}
