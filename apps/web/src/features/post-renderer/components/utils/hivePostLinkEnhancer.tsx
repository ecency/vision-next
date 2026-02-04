import { createRoot } from "react-dom/client";
import { HivePostLinkRenderer } from "../extensions";
import { findPostLinkElements, isWaveLikePost } from "../functions";

export function applyHivePostLinks(
    container: HTMLElement,
    postLinkElements: HTMLAnchorElement[] = findPostLinkElements(container),
) {
    postLinkElements
        .filter((el) => !isWaveLikePost(el.getAttribute("href") ?? ""))
        .forEach((el) => {
            try {
                if (el.dataset.enhanced === "true") return;
                
                // Verify element is still connected to the DOM
                if (!el.isConnected || !el.parentElement) {
                    console.warn("Hive post link element is not connected to DOM, skipping");
                    return;
                }
                
                el.dataset.enhanced = "true";

                const link = el.getAttribute("href") ?? "";
                const wrapper = document.createElement("div");
                wrapper.classList.add("ecency-renderer-hive-post-extension");

                const root = createRoot(wrapper);
                root.render(<HivePostLinkRenderer link={link} />);

                // Final safety check before replacing
                if (el.isConnected && el.parentElement) {
                    el.parentElement.replaceChild(wrapper, el);
                }
            } catch (error) {
                console.warn("Error enhancing Hive post link element:", error);
            }
        });
}
