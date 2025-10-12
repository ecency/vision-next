"use client";

import React, { RefObject, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./hive-operation-extension.scss";
import { Operation } from "@hiveio/dhive";

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
      <span className="ecency-renderer-hive-operation-extension-label">
        Hive operation, click to Sign
      </span>
            {!decodedOp && op}
            <div className="ecency-renderer-hive-operation-extension-content">
                {decodedOp && (
                    <>
                        <div className="ecency-renderer-hive-operation-extension-type">
                            {decodedOpType}
                        </div>
                        {decodedOpType === "transfer" && (
                            <div className="ecency-renderer-hive-operation-extension-transfer">
                <span className="ecency-renderer-hive-operation-extension-transfer-highlight">
                  {decodedOp[1].amount}
                </span>
                                <span> to</span>
                                <img
                                    src={`https://images.ecency.com/u/${decodedOp[1].to}/avatar/small`}
                                    className="ecency-renderer-hive-operation-extension-transfer-image"
                                    alt=""
                                />
                                <span className="ecency-renderer-hive-operation-extension-transfer-highlight">
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
    useEffect(() => {
        Array.from(
            containerRef.current?.querySelectorAll<HTMLElement>(
                ".markdown-view:not(.markdown-view-pure) .markdown-external-link"
            ) ?? []
        )
            .filter((element) => element.innerText?.startsWith("hive://sign/op/"))
            .forEach((element) => {
                const container = document.createElement("div");
                container.classList.add("ecency-renderer-hive-operation-extension");

                const op = element.innerText.replace("hive://sign/op/", "");

                container.addEventListener("click", () => onClick?.(op));

                const root = createRoot(container);
                root.render(<HiveOperationRenderer op={op} />);

                element.parentElement?.replaceChild(container, element);
            });
    }, [containerRef, onClick]);

    return null;
}
