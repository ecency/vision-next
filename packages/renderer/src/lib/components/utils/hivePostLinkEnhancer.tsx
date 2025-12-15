import { createRoot } from "react-dom/client";
import { HivePostLinkRenderer } from "../extensions";
import { findPostLinkElements, isWaveLikePost } from "../functions";

export function applyHivePostLinks(
    container: HTMLElement,
    postLinkElements: HTMLAnchorElement[] = findPostLinkElements(container),
) {
    postLinkElements
        .filter((el) => el.dataset.isInline !== "true")
        .filter((el) => !isWaveLikePost(el.getAttribute("href") ?? ""))
        .forEach((el) => {
            try {
                if (el.dataset.enhanced === "true") return;
                el.dataset.enhanced = "true";

                // Verify element is still connected to the DOM
                if (!el.isConnected) {
                    console.warn("Hive post link element is no longer connected to DOM, skipping");
                    return;
                }

                // Verify parentElement exists before attempting manipulation
                const parentElement = el.parentElement;
                if (!parentElement) {
                    console.warn("Hive post link element has no parent, skipping");
                    return;
                }

                const link = el.getAttribute("href") ?? "";
                const wrapper = document.createElement("div");
                wrapper.classList.add("ecency-renderer-hive-post-extension");

                const root = createRoot(wrapper);
                root.render(<HivePostLinkRenderer link={link} />);

                // Final check before replacing - ensure element is still in DOM
                if (el.isConnected && el.parentElement) {
                    el.parentElement.replaceChild(wrapper, el);
                }
            } catch (error) {
                // Handle any errors during DOM manipulation gracefully
                console.warn("Error enhancing hive post link element:", error);
            }
        });
}
