"use client";

import { Comment } from "@/features/shared";
import i18next from "i18next";
import { Entry } from "@/entities";
import { useRouter } from "next/navigation";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { useUpdateReply } from "@/api/mutations";
import { delay, makeJsonMetaDataReply } from "@/utils";
import appPackage from "../../../../../../../../package.json";
import { useContext, useEffect, useMemo, useState } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import { EcencyEntriesCacheManagement } from "@/core/caches";

interface Props {
  entry: Entry;
}

function isEntry(x: unknown): x is Entry {
  return !!x && typeof x === "object" && "author" in (x as any) && "permlink" in (x as any);
}

export function EntryPageEdit({ entry: initialEntry }: Props) {
  const router = useRouter();
  const { data: entryRaw } =
      EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();

  // ✅ Use a guaranteed Entry for the rest of the component
  const entry = useMemo<Entry>(() => (isEntry(entryRaw) ? entryRaw : initialEntry), [entryRaw, initialEntry]);

  const [_, __, clearText] = useLocalStorage(PREFIX + "_c_t", "");
  const { commentsInputRef, isEdit, setIsEdit } = useContext(EntryPageContext);
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: updateReplyApi, isPending } = useUpdateReply(entry, async () => {
    setIsLoading(true);
    await delay(2000);
    router.push(`/${entry.category}/@${entry.author}/${entry.permlink}`);
  });

  const updateReply = async (text: string) => {
    return updateReplyApi({
      text,
      point: true,
      jsonMeta: makeJsonMetaDataReply(entry.json_metadata?.tags || ["ecency"], appPackage.version)
    });
  };

  useEffect(() => {
    if (!isEdit) {
      setIsLoading(false);
      clearText();
    }
  }, [isEdit, clearText]);

  if (!isEdit) return null;

  return (
      <div className="relative">
        <Comment
            isEdit
            submitText={i18next.t("g.update")}
            entry={entry}
            onSubmit={updateReply}
            cancellable
            onCancel={() => setIsEdit(false)}
            inProgress={isLoading || isPending}
            autoFocus
            inputRef={commentsInputRef}
        />
      </div>
  );
}

export default EntryPageEdit;
