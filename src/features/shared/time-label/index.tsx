"use client";

import { useEffect, useState } from "react";
import { dateToFormatted, dateToRelative } from "@/utils";

export function TimeLabel({ created, refresh }: { created: string; refresh?: number }) {
    const [relative, setRelative] = useState<string | null>(null);

    const formatted = dateToFormatted(created); // safe for SSR

    useEffect(() => {
        // Runs only on client, so safe to show local relative time
        setRelative(dateToRelative(created));
    }, [created, refresh]);

    return (
        <span className="date" title={formatted}>
      {relative ?? formatted}
    </span>
    );
}
