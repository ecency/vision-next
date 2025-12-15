import { createRoot } from "react-dom/client";
import { HiveOperationRenderer } from "../extensions";

export function applyHiveOperations(
    container: HTMLElement,
    onClick?: (op: string) => void
) {
    Array.from(
        container.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-external-link"
        )
    )
        .filter((el) => el.innerText.startsWith("hive://sign/op/"))
        .forEach((el) => {
            try {
                if (el.dataset.enhanced === "true") return;
                el.dataset.enhanced = "true";

                // Verify element is still connected to the DOM
                if (!el.isConnected) {
                    console.warn("Hive operation element is no longer connected to DOM, skipping");
                    return;
                }

                // Verify parentElement exists before attempting manipulation
                const parentElement = el.parentElement;
                if (!parentElement) {
                    console.warn("Hive operation element has no parent, skipping");
                    return;
                }

                const op = el.innerText.replace("hive://sign/op/", "");

                const wrapper = document.createElement("div");
                wrapper.classList.add("ecency-renderer-hive-operation-extension");
                wrapper.addEventListener("click", () => onClick?.(op));

                const root = createRoot(wrapper);
                root.render(<HiveOperationRenderer op={op} />);

                // Final check before replacing - ensure element is still in DOM
                if (el.isConnected && el.parentElement) {
                    el.parentElement.replaceChild(wrapper, el);
                }
            } catch (error) {
                // Handle any errors during DOM manipulation gracefully
                console.warn("Error enhancing hive operation element:", error);
            }
        });
}
