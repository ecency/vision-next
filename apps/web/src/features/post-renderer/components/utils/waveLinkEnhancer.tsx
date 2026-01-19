import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { WaveLikePostRenderer } from "../extensions";
import { findPostLinkElements, isWaveLikePost } from "../functions";
import { getQueryClient } from "@/core/react-query";

/**
 * Progressive DOM enhancer for wave-like post links
 */
export function applyWaveLikePosts(
    container: HTMLElement,
    postLinkElements: HTMLAnchorElement[] = findPostLinkElements(container),
) {
    const queryClient = getQueryClient();

    postLinkElements
        .filter((el) => isWaveLikePost(el.getAttribute("href") ?? ""))
        .forEach((el) => {
            if (el.dataset.enhanced === "true") return;
            el.dataset.enhanced = "true";

            const link = el.getAttribute("href") ?? "";

            const wrapper = document.createElement("div");
            wrapper.classList.add("ecency-renderer-wave-like-extension");

            const root = createRoot(wrapper);
            root.render(
                <QueryClientProvider client={queryClient}>
                    <WaveLikePostRenderer link={link} />
                </QueryClientProvider>
            );

            el.parentElement?.replaceChild(wrapper, el);
        });
}
