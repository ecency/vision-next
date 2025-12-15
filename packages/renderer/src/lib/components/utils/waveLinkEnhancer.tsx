import { createRoot } from "react-dom/client";
import { WaveLikePostRenderer } from "../extensions";
import { findPostLinkElements, isWaveLikePost } from "../functions";

/**
 * Progressive DOM enhancer for wave-like post links
 */
export function applyWaveLikePosts(
    container: HTMLElement,
    postLinkElements: HTMLAnchorElement[] = findPostLinkElements(container),
) {
    postLinkElements
        .filter((el) => el.dataset.isInline !== "true")
        .filter((el) => isWaveLikePost(el.getAttribute("href") ?? ""))
        .forEach((el) => {
            try {
                if (el.dataset.enhanced === "true") return;
                el.dataset.enhanced = "true";

                // Verify element is still connected to the DOM
                if (!el.isConnected) {
                    console.warn("Wave-like post link element is no longer connected to DOM, skipping");
                    return;
                }

                // Verify parentElement exists before attempting manipulation
                const parentElement = el.parentElement;
                if (!parentElement) {
                    console.warn("Wave-like post link element has no parent, skipping");
                    return;
                }

                const link = el.getAttribute("href") ?? "";

                const wrapper = document.createElement("div");
                wrapper.classList.add("ecency-renderer-wave-like-extension");

                const root = createRoot(wrapper);
                root.render(<WaveLikePostRenderer link={link} />);

                // Final check before replacing - ensure element is still in DOM
                if (el.isConnected && el.parentElement) {
                    el.parentElement.replaceChild(wrapper, el);
                }
            } catch (error) {
                // Handle any errors during DOM manipulation gracefully
                console.warn("Error enhancing wave-like post link element:", error);
            }
        });
}
