import { createRoot } from "react-dom/client";
import { AuthorLinkRenderer } from "../extensions";

export function applyAuthorLinks(container: HTMLElement) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-author-link"
        )
    );

    elements.forEach((el) => {
        try {
            if (el.dataset.enhanced === "true") return;

            // Verify element is still connected to the DOM
            if (!el.isConnected || !el.parentElement) {
                console.warn("Author link element is not connected to DOM, skipping");
                return;
            }

            // Skip mentions inside archived tweet blocks
            if (el.closest(".markdown-view")?.textContent?.includes("Archived Tweet from")) return;
            
            el.dataset.enhanced = "true";

            const authorHref = el.getAttribute("href");
            if (!authorHref) return;

            const wrapper = document.createElement("a");
            wrapper.href = authorHref;
            wrapper.target = "_blank";
            wrapper.rel = "noopener";
            wrapper.classList.add("ecency-renderer-author-extension", "ecency-renderer-author-extension-link");

            const root = createRoot(wrapper);
            root.render(<AuthorLinkRenderer author={authorHref} />);

            // Final safety check before replacing
            if (el.isConnected && el.parentElement) {
                el.parentElement.replaceChild(wrapper, el);
            }
        } catch (error) {
            console.warn("Error enhancing author link element:", error);
        }
    });
}
