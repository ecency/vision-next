import { createRoot } from "react-dom/client";
import { AuthorLinkRenderer } from "../extensions";

export function applyAuthorLinks(container: HTMLElement) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-author-link"
        )
    );

    elements.forEach((el) => {
        if (el.dataset.enhanced === "true") return;
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

        el.parentElement?.replaceChild(wrapper, el);
    });
}
