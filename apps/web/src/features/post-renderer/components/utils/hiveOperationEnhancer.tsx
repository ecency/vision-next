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
            if (el.dataset.enhanced === "true") return;
            el.dataset.enhanced = "true";

            const op = el.innerText.replace("hive://sign/op/", "");

            const wrapper = document.createElement("div");
            wrapper.classList.add("ecency-renderer-hive-operation-extension");
            wrapper.addEventListener("click", () => onClick?.(op));

            const root = createRoot(wrapper);
            root.render(<HiveOperationRenderer op={op} />);

            el.parentElement?.replaceChild(wrapper, el);
        });
}
