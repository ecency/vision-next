"use client";

import { useEffect, useState } from "react";
import { dateToFormatted, dateToFormattedUtc, dateToRelative } from "@/utils";

export function TimeLabel({ created, refresh }: { created: string; refresh?: number }) {
    const [display, setDisplay] = useState<string | null>(null);
    const [localFormatted, setLocalFormatted] = useState<string | null>(null);

    // True UTC formatted date - identical on server and client, no hydration mismatch
    const ssrSafe = dateToFormattedUtc(created);

    useEffect(() => {
        setDisplay(dateToRelative(created));
        setLocalFormatted(dateToFormatted(created));
    }, [created, refresh]);

    return (
        <span className="date" title={localFormatted ?? ssrSafe}>
      {display ?? ssrSafe}
    </span>
    );
}
