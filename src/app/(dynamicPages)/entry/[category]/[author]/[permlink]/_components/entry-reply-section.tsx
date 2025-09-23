"use client";

import { Comment } from "@/features/shared";
import i18next from "i18next";
import { Entry } from "@/entities";
import { createReplyPermlink, makeJsonMetaDataReply } from "@/utils";
import { useCreateReply } from "@/api/mutations";
import appPackage from "../../../../../../../../package.json";
import { useContext } from "react";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";

interface Props {
    entry: Entry;
}

export function EntryReplySection({ entry }: Props) {
    const { commentsInputRef, setSelection } = useContext(EntryPageContext);

    const { mutateAsync: createReply, isPending } = useCreateReply(entry, entry, () => {});

    const replySubmitted = async (text: string) => {
        const permlink = createReplyPermlink(entry.author);
        const tags = entry.json_metadata?.tags || ["ecency"];

        const response = await createReply({
            jsonMeta: makeJsonMetaDataReply(tags, appPackage.version),
            text,
            permlink,
            point: true
        });

        setSelection("");
        return response;
    };

    return (
        <Comment
            submitText={i18next.t("g.reply")}
            entry={entry}
            onSubmit={replySubmitted}
            inProgress={isPending}
            inputRef={commentsInputRef}
        />
    );
}
