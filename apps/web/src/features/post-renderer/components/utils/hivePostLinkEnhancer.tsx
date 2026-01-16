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
            if (el.dataset.enhanced === "true") return;
            el.dataset.enhanced = "true";

            const link = el.getAttribute("href") ?? "";
            const wrapper = document.createElement("div");
            wrapper.classList.add("ecency-renderer-hive-post-extension");

            const root = createRoot(wrapper);
            root.render(<HivePostLinkRenderer link={link} />);

            el.parentElement?.replaceChild(wrapper, el);
        });
}
