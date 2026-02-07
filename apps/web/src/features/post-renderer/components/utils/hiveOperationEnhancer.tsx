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
                
                // Verify element is still connected to the DOM
                if (!el.isConnected || !el.parentElement) {
                    console.warn("Hive operation element is not connected to DOM, skipping");
                    return;
                }
                
                el.dataset.enhanced = "true";

                const op = el.innerText.replace("hive://sign/op/", "");

                const wrapper = document.createElement("div");
                wrapper.classList.add("ecency-renderer-hive-operation-extension");
                wrapper.addEventListener("click", () => onClick?.(op));

                const root = createRoot(wrapper);
                root.render(<HiveOperationRenderer op={op} />);

                // Final safety check before replacing
                if (el.isConnected && el.parentElement) {
                    el.parentElement.replaceChild(wrapper, el);
                }
            } catch (error) {
                console.warn("Error enhancing Hive operation element:", error);
            }
        });
}
