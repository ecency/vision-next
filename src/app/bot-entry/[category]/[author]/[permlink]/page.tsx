
import { Metadata } from "next";
import {generateEntryMetadata} from "@/app/(dynamicPages)/entry/_helpers";

interface Props {
    params: Promise<{ author: string; permlink: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { author, permlink } = await params;
    return generateEntryMetadata(author, permlink);
}

export default async function BotEntryPage({ params }: Props) {
    const { author, permlink } = await params;
    return (
        <html>
        <head>
            {/* next will inject generateMetadata here */}
        </head>
        <body>
        <h1>Ecency bot preview for {author}/{permlink}</h1>
        </body>
        </html>
    )
}
