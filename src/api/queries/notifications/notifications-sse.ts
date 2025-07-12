import { useEffect } from "react";

export function useNotificationSSE(username?: string, onEvent?: () => void) {
    useEffect(() => {
        if (!username) return;

        const eventSource = new EventSource(`/api/notifications-stream?username=${username}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "notification") {
                onEvent?.();
            }
        };

        eventSource.onerror = () => {
            console.warn("SSE connection lost. Reconnecting...");
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [username, onEvent]);
}
