import { getQueryClient } from "@/core/react-query";
import {makeEntryPath} from "@/utils"; // your shared query client

interface EngagementPayload {
    type: "engagement_update";
    stats: {
        total_votes: number;
    }
    children: number;
    pending_payout_value: string;
    active_votes: { voter: string; rshares: number }[];
}

export function initEntrySSE(
    author: string,
    permlink: string,
    onUpdate?: (data: EngagementPayload) => void
): () => void {
    if (!author || !permlink) {
        console.warn("initEntrySSE: missing author or permlink");
        return () => {};
    }

    const queryClient = getQueryClient();

    const url = `/api/entry-stream?author=${author}&permlink=${permlink}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
        try {
            const data: EngagementPayload = JSON.parse(event.data);

            // Optional external callback
            onUpdate?.(data);

            queryClient.setQueryData(["entry", makeEntryPath("", author, permlink ?? "")], (old: any) => {
                if (!old) return old;

                return {
                    ...old,
                    stats: {
                        ...old.stats,
                        total_votes: data.stats.total_votes,
                    },
                    active_votes: data.active_votes,
                    children: data.children,
                    pending_payout_value: data.pending_payout_value,
                };
            });
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
}
