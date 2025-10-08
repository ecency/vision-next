"use client";

import { EditHistory } from "@/features/shared";
import { Entry } from "@/entities";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { useContext, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
  entry: Entry;
}

export function EntryPageEditHistory({ entry }: Props) {
  const { editHistory, setEditHistory } = useContext(EntryPageContext);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (editHistory && !searchParams.has("history")) {
      params.set("history", "");
      const qs = params.toString().replace(/=(&|$)/g, "$1");
      router.replace(`${pathname}?${qs}`);
    }
    if (!editHistory && searchParams.has("history")) {
      params.delete("history");
      const qs = params.toString().replace(/=(&|$)/g, "$1");
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [editHistory, pathname, router, searchParams]);

  return editHistory ? (
    <EditHistory entry={entry} onHide={() => setEditHistory(false)} />
  ) : (
    <></>
  );
}
