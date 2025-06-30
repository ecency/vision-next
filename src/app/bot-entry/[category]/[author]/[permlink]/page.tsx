
import { Metadata } from "next";
import {generateEntryMetadata} from "@/app/(dynamicPages)/entry/_helpers";

interface Props {
    params: { author: string; permlink: string; category: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return generateEntryMetadata(params.author, params.permlink);
}

export default async function BotEntryPage({ params }: Props) {
    const { author, permlink } = params;
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
