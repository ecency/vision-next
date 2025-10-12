import mediumZoom from "medium-zoom";

export function applyImageZoom(container: HTMLElement) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        )
    ).filter(
        (x) =>
            x.parentNode?.nodeName !== "A" &&
            !x.classList.contains("medium-zoom-image") &&
            !x.closest(".markdown-image-container")
    );

    elements.forEach((el) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("markdown-image-container");

        const clonedImage = el.cloneNode(true) as HTMLElement;

        const title = el.getAttribute("title")?.trim();
        const dataCaption = el.getAttribute("data-caption")?.trim();
        const alt = el.getAttribute("alt")?.trim();

        const isAltFilename = alt
            ? /^[\w,\s-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(alt)
            : false;

        const captionText = title || dataCaption || (!isAltFilename ? alt : "");

        if (captionText) {
            const caption = document.createElement("div");
            caption.classList.add("markdown-img-caption");
            caption.innerText = captionText;
            wrapper.appendChild(clonedImage);
            wrapper.appendChild(caption);
        } else {
            wrapper.appendChild(clonedImage);
        }

        el.parentElement?.replaceChild(wrapper, el);
    });

    // apply medium zoom
    const zoom = mediumZoom(
        container.querySelectorAll<HTMLImageElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        )
    );
    zoom.update({ background: "#131111" });
}
