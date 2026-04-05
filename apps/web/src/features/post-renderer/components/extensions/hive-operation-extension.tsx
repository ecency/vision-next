"use client";

import React, { RefObject, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./hive-operation-extension.scss";
import type { Operation } from "@ecency/hive-tx";
import defaults from "@/defaults";

interface Props {
    op: string;
}

export function HiveOperationRenderer({ op }: Props) {
    const decodedOp = useMemo(() => {
        try {
            const raw = atob(op);
            return JSON.parse(raw) as Operation;
        } catch (e) {
            return undefined;
        }
    }, [op]);

    const decodedOpType = useMemo(
        () => decodedOp?.[0].split("_").join(" "),
        [decodedOp]
    );

    return (
        <>
      <span className="er-hive-op-label">
        Hive operation, click to Sign
      </span>
            {!decodedOp && op}
            <div className="er-hive-op-content">
                {decodedOp && (
                    <>
                        <div className="er-hive-op-type">
                            {decodedOpType}
                        </div>
                        {decodedOpType === "transfer" && (
                            <div className="er-hive-op-transfer">
                <span className="er-hive-op-transfer-highlight">
                  {decodedOp[1].amount}
                </span>
                                <span> to</span>
                                <img
                                    src={`${defaults.imageServer}/u/${decodedOp[1].to}/avatar/small`}
                                    className="er-hive-op-transfer-image"
                                    alt=""
                                />
                                <span className="er-hive-op-transfer-highlight">
                  {decodedOp[1].to}
                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

export function HiveOperationExtension({
    containerRef,
    onClick,
}: {
    containerRef: RefObject<HTMLElement | null>;
    onClick?: (op: string) => void;
}) {
    const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);
    const onClickRef = useRef(onClick);
    useEffect(() => {
        onClickRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        Array.from(
            containerRef.current?.querySelectorAll<HTMLElement>(
                ".markdown-view:not(.markdown-view-pure) .markdown-external-link"
            ) ?? []
        )
            .filter((element) => element.innerText?.startsWith("hive://sign/op/"))
            .forEach((element) => {
                try {
                    // Verify element is still connected to the DOM before manipulation
                    if (!element.isConnected || !element.parentNode) {
                        console.warn("Hive operation element is not connected to DOM, skipping");
                        return;
                    }

                    const container = document.createElement("div");
                    container.classList.add("er-hive-op");

                    const op = element.innerText.replace("hive://sign/op/", "");

                    container.addEventListener("click", () => onClickRef.current?.(op));

                    const root = createRoot(container);
                    rootsRef.current.push(root);
                    root.render(<HiveOperationRenderer op={op} />);

                    // Final safety check before replacing
                    if (element.isConnected && element.parentElement) {
                        element.parentElement.replaceChild(container, element);
                    }
                } catch (error) {
                    console.warn("Error enhancing Hive operation element:", error);
                }
            });

        return () => {
            for (const r of rootsRef.current) { r.unmount(); }
            rootsRef.current = [];
        };
    }, [containerRef]);

    return null;
}
