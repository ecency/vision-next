"use client";

import { useEffect, useState } from "react";
import { dateToFormatted, dateToRelative } from "@/utils";

export function TimeLabel({ created, refresh }: { created: string; refresh?: number }) {
    // Initial state null ensures server and client first render match (both show UTC formatted date).
    // useEffect then swaps to relative time ("2h ago") and local-timezone tooltip on the client.
    const [display, setDisplay] = useState<string | null>(null);
    const [localFormatted, setLocalFormatted] = useState<string | null>(null);

    // UTC formatted date - safe for SSR, no timezone mismatch
    const utcFormatted = dateToFormatted(created, "YYYY-MM-DD HH:mm");

    useEffect(() => {
        setDisplay(dateToRelative(created));
        setLocalFormatted(dateToFormatted(created));
    }, [created, refresh]);

    return (
        <span className="date" title={localFormatted ?? utcFormatted}>
      {display ?? utcFormatted}
    </span>
    );
}
