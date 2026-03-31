export function applyTagLinks(container: HTMLElement) {
    const tags = container.querySelectorAll<HTMLAnchorElement>(
        ".markdown-view:not(.markdown-view-pure) .markdown-tag-link"
    );
    tags.forEach(tag => {
        tag.classList.add("er-tag-enhanced");
        // more DOM changes if needed
    });
}
