import { useEffect, useRef } from "react";

interface EngagementPayload {
    type: "engagement_update";
    stats: {
        total_votes: number;
    };
    children: number;
    pending_payout_value: string;
}

export function useEntryStream(
    author: string,
    permlink: string,
    onUpdate: (data: EngagementPayload) => void
) {
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!author || !permlink) return;

        const url = `/api/entry-stream?author=${author}&permlink=${permlink}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data: EngagementPayload = JSON.parse(event.data);
                onUpdate(data);
            } catch (e) {
                console.warn("Invalid SSE payload", e);
            }
        };

        es.onerror = (e) => {
            console.warn("SSE error", e);
            es.close();
        };

        return () => {
            es.close();
        };
    }, [author, permlink, onUpdate]);
}
