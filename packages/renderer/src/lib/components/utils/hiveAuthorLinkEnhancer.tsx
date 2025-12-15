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
            el.dataset.enhanced = "true";

            const authorHref = el.getAttribute("href");
            if (!authorHref) return;

            // Verify element is still connected to the DOM
            if (!el.isConnected) {
                console.warn("Author link element is no longer connected to DOM, skipping");
                return;
            }

            // Verify parentElement exists before attempting manipulation
            const parentElement = el.parentElement;
            if (!parentElement) {
                console.warn("Author link element has no parent, skipping");
                return;
            }

            const wrapper = document.createElement("a");
            wrapper.href = authorHref;
            wrapper.target = "_blank";
            wrapper.rel = "noopener";
            wrapper.classList.add("ecency-renderer-author-extension", "ecency-renderer-author-extension-link");

            const root = createRoot(wrapper);
            root.render(<AuthorLinkRenderer author={authorHref} />);

            // Final check before replacing - ensure element is still in DOM
            if (el.isConnected && el.parentElement) {
                el.parentElement.replaceChild(wrapper, el);
            }
        } catch (error) {
            // Handle any errors during DOM manipulation gracefully
            console.warn("Error enhancing author link element:", error);
        }
    });
}
