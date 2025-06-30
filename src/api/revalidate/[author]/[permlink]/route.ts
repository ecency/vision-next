import { revalidatePath } from "next/cache";

export async function POST(
    request: Request,
    { params }: { params: { author: string; permlink: string } }
) {
    try {
        const path = `/bot-entry/@${params.author}/${params.permlink}`;
        revalidatePath(path);
        return new Response(`Revalidated: ${path}`, { status: 200 });
    } catch (err) {
        console.error("Revalidate failed", err);
        return new Response("Failed to revalidate", { status: 500 });
    }
}
