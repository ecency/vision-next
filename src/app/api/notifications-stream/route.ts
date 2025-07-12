import { NextRequest } from "next/server";
import {appAxios} from "@/api/axios";
import {apiBase} from "@/api/helper";

export const runtime = "nodejs"; // Required for streams

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const username = searchParams.get("username");

    if (!username) {
        return new Response("Missing username", { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            let closed = false;

            const safeEnqueue = (chunk: string) => {
                if (!closed) {
                    try {
                        controller.enqueue(encoder.encode(chunk));
                    } catch (err) {
                        closed = true;
                    }
                }
            };

            let previousCount = 0;

            const checkInterval = setInterval(async () => {
                if (closed) return;
                try {
                    const currentCount = await getUnreadCount(username);

                    // Check again AFTER await to be safe
                    if (closed) return;

                    if (currentCount > previousCount) {
                        previousCount = currentCount;
                        const message = JSON.stringify({ type: "notification", count: currentCount });
                        safeEnqueue(`data: ${message}\n\n`);
                    }
                } catch (err) {
                    console.warn("Polling failed:", err);
                }
            }, 10000);

            const keepAlive = setInterval(() => {
                safeEnqueue(":\n\n"); // SSE comment ping
            }, 15000);

            const cleanup = () => {
                if (!closed) {
                    clearInterval(checkInterval);
                    clearInterval(keepAlive);
                    try {
                        controller.close();
                    } catch {}
                    closed = true;
                }
            };

            req.signal.addEventListener("abort", cleanup);
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

async function getUnreadCount(username: string): Promise<number> {
    try {
        const { data } = await appAxios.get(apiBase(`/private-api/pub-notifications/${username}`));
        return data.count ?? 0;
    } catch (err) {
        console.warn("Unread count fetch failed:", err);
        return 0;
    }
}

