import { NextRequest } from "next/server";
import { getPost } from "@/api/bridge";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const author = searchParams.get("author");
    const permlink = searchParams.get("permlink");

    if (!author || !permlink) {
        return new Response("Missing author or permlink", { status: 400 });
    }

    const encoder = new TextEncoder();

    let previous = {
        voteCount: 0,
        commentCount: 0,
        payout: "0.000 HBD",
    };

    const stream = new ReadableStream({
        async start(controller) {
            let closed = false;

            const safeEnqueue = (chunk: string) => {
                if (closed) return;
                try {
                    if (controller.desiredSize !== null && controller.desiredSize <= 0) {
                        console.warn("Backpressure detected");
                        return;
                    }
                    controller.enqueue(encoder.encode(chunk));
                } catch (err) {
                    console.warn("Stream enqueue failed:", err);
                    closed = true;
                }
            };

            const poll = async () => {
                try {
                    const data = await getPost(author, permlink);
                    if (!data) return;

                    const {
                        stats: { total_votes: voteCount },
                        children: commentCount,
                        pending_payout_value: pendingPayout,
                    } = data;

                    if (
                        voteCount !== previous.voteCount ||
                        commentCount !== previous.commentCount ||
                        pendingPayout !== previous.payout
                    ) {
                        previous = {
                            voteCount,
                            commentCount,
                            payout: pendingPayout,
                        };

                        const message = JSON.stringify({
                            type: "engagement_update",
                            stats: { total_votes: voteCount },
                            children: commentCount,
                            pending_payout_value: pendingPayout,
                        });

                        safeEnqueue(`data: ${message}\n\n`);
                    }
                } catch (err) {
                    console.warn("Polling error:", err);
                }
            };

            const pollInterval = setInterval(poll, 10000);
            const keepAlive = setInterval(() => safeEnqueue(":\n\n"), 15000);

            req.signal.addEventListener("abort", () => {
                closed = true;
                clearInterval(pollInterval);
                clearInterval(keepAlive);
                try {
                    controller.close();
                } catch {}
                console.log(`SSE aborted for ${author}/${permlink}`);
            });

            console.log(`SSE started for ${author}/${permlink}`);
            await poll();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
