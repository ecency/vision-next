import mediumZoom from "medium-zoom";

export function applyImageZoom(container: HTMLElement) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        )
    ).filter((x) => {
        try {
            // Verify element is still connected to the DOM
            if (!x.isConnected) {
                return false;
            }

            // Safe parentNode access with null checking for iOS Safari
            const parentNode = x.parentNode;
            if (!parentNode) {
                return false;
            }

            return (
                parentNode.nodeName !== "A" &&
                !x.classList.contains("medium-zoom-image") &&
                !x.closest(".markdown-image-container")
            );
        } catch (error) {
            // Handle iOS Safari security errors or other DOM access issues
            console.warn("Error accessing image element properties:", error);
            return false;
        }
    });

    elements.forEach((el) => {
        try {
            // Re-verify element is still connected before manipulation
            if (!el.isConnected) {
                console.warn("Image element is no longer connected to DOM, skipping");
                return;
            }

            // Verify parentElement exists before attempting manipulation
            const parentElement = el.parentElement;
            if (!parentElement) {
                console.warn("Image element has no parent, skipping");
                return;
            }

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

            // Final check before replacing - ensure element is still in DOM
            if (el.isConnected && el.parentElement) {
                el.parentElement.replaceChild(wrapper, el);
            }
        } catch (error) {
            // Handle any errors during DOM manipulation gracefully
            console.warn("Error enhancing image element:", error);
        }
    });

    // apply medium zoom
    const zoom = mediumZoom(
        container.querySelectorAll<HTMLImageElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        )
    );
    zoom.update({ background: "#131111" });
}
