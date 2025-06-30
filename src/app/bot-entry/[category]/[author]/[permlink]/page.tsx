import { renderPostBody } from "@ecency/render-helper";
import { getContent } from "@/api/hive";
import { Metadata } from "next";
import { generateEntryMetadata } from "@/app/(dynamicPages)/entry/_helpers";

interface Props {
    params: Promise<{ author: string; permlink: string }>
}

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const {author, permlink} = await params;
    return generateEntryMetadata(author.replace("%40", ""), permlink);
}

export default async function BotEntryPage({ params }: Props) {
    try {
        const {author, permlink} = await params;
        const entry = await getContent(author.replace("%40", ""), permlink);

        if (!entry || !entry.body) {
            return (
                <html lang="en">
                <head><title>Post not found</title></head>
                <body><h1>Post not found</h1></body>
                </html>
            );
        }

        const html = renderPostBody(entry.body, false, true);

        return (
            <html lang="en">
            <head>{/* metadata injected by Next */}</head>
            <body>
            <main>
                <article>
                    <h1>{entry.title}</h1>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                </article>
            </main>
            </body>
            </html>
        );
    } catch (err) {
        console.error("BotEntryPage failed:", err);
        return (
            <html lang="en">
            <head><title>Error</title></head>
            <body>
            <h1>500: Something went wrong</h1>
            <pre>{String(err)}</pre>
            </body>
            </html>
        );
    }
}

