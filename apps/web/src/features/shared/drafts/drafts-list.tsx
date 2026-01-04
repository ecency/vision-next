import React, { useEffect, useMemo, useRef, useState } from "react";
import { LinearProgress } from "@/features/shared";
import { FormControl } from "@ui/input";
import { DraftListItem } from "@/features/shared/drafts/draft-list-item";
import { getDraftsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import i18next from "i18next";
import { useCloneDraft, useDeleteDraft } from "@/api/mutations";
import { usePathname, useRouter } from "next/navigation";
import useMount from "react-use/lib/useMount";

interface Props {
  onHide: () => void;
  onPick?: (url: string) => void;
}

export function DraftsList({ onHide, onPick }: Props) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { activeUser } = useActiveAccount();

  const [filter, setFilter] = useState("");
  const { data, isPending, refetch } = useQuery(getDraftsQueryOptions(activeUser?.username));

  const items = useMemo(
    () =>
      data
        ?.filter((x) => x.title.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
        .sort((a, b) => (new Date(b.modified).getTime() > new Date(a.modified).getTime() ? 1 : -1)) ??
      [],
    [data, filter]
  );

  const { mutateAsync: cloneDraft, isPending: isCloning } = useCloneDraft(() => {
    listRef.current?.scrollIntoView(true);
  });
  const { mutateAsync: deleteDraft } = useDeleteDraft((id) => {
    // if user editing the draft, redirect to submit page
    if (pathname === `/draft/${id}`) {
      router.push("/publish");
    }
  });

  useMount(() => {
    refetch();
  });

  useEffect(() => {
    if (data && data.length > 0) {
      innerRef.current?.focus();
    }
  }, [data]);

  if (isPending) {
    return <LinearProgress />;
  }

  if (data?.length === 0) {
    return <div className="drafts-list">{i18next.t("g.empty-list")}</div>;
  }

  return (
    <div className="dialog-content">
      <div className="dialog-filter sticky -top-12 sm:top-4 w-full bg-white border-b border-[--border-color] pt-2 pb-4">
        <FormControl
          ref={innerRef}
          type="text"
          placeholder={i18next.t("drafts.filter")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {isCloning && <LinearProgress />}
      {items.length === 0 && <span className="text-gray-600">{i18next.t("g.no-matches")}</span>}

      {items.length > 0 && (
        <div className="drafts-list">
          <div className="flex flex-col gap-4 my-4" ref={listRef}>
            {items.map((item) => (
              <DraftListItem
                key={item._id}
                draft={item}
                editFn={(_, isNewEditor) => {
                  if (isNewEditor) {
                    router.push(`/publish/drafts/${item._id}`);
                  } else {
                    router.push(`/draft/${item._id}`);
                  }
                  onHide();
                }}
                deleteFn={() => deleteDraft({ id: item._id })}
                cloneFn={() => cloneDraft({ item })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
