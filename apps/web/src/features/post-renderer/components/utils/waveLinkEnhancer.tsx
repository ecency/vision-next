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
            if (el.dataset.enhanced === "true") return;
            el.dataset.enhanced = "true";

            const link = el.getAttribute("href") ?? "";

            const wrapper = document.createElement("div");
            wrapper.classList.add("ecency-renderer-wave-like-extension");

            const root = createRoot(wrapper);
            root.render(<WaveLikePostRenderer link={link} />);

            el.parentElement?.replaceChild(wrapper, el);
        });
}
