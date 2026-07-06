import { useActiveAccount } from "@/core/hooks/use-active-account";
import { LinearProgress } from "@/features/shared";
import { Draft, getDraftsInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UilMinusCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { PostTemplatesListItem } from "./post-templates-list-item";
import { getAccessToken } from "@/utils";

// Templates are sparse among ordinary drafts, so pages are chain-fetched
// until at least this many templates have been accumulated.
const TEMPLATES_AUTO_FETCH_TARGET = 30;

interface Props {
  onApply: (draft: Draft) => void;
  onSave: () => void;
  confirmApply: boolean;
}

export function PostTemplatesList({ onApply, onSave, confirmApply }: Props) {
  const innerRef = useRef<HTMLInputElement | null>(null);

  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const accessToken = username ? getAccessToken(username) : undefined;

  const [filter, setFilter] = useState("");

  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    getDraftsInfiniteQueryOptions(username, accessToken, 10)
  );

  const templates = useMemo(
    () =>
      (data?.pages.flatMap((page) => page.data) ?? []).filter((item) => item.meta?.postTemplate),
    [data]
  );

  const items = useMemo(
    () =>
      templates
        .filter((x) =>
          (x.meta?.templateName ?? x.title ?? "").toLowerCase().includes(filter.toLowerCase())
        )
        .sort((a, b) => (new Date(b.modified).getTime() > new Date(a.modified).getTime() ? 1 : -1)),
    [templates, filter]
  );

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && templates.length < TEMPLATES_AUTO_FETCH_TARGET) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, templates.length]);

  useEffect(() => {
    innerRef.current && innerRef.current.focus();
  }, []);

  return (
    <div>
      <div className="flex gap-4">
        <FormControl
          ref={innerRef}
          type="text"
          placeholder={i18next.t("post-templates.filter")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginRight: "6px" }}
        />
        <div>
          <Button className="h-full whitespace-nowrap" onClick={onSave}>
            {i18next.t("post-templates.save-current")}
          </Button>
        </div>
      </div>

      {(isPending || (items.length === 0 && (hasNextPage || isFetchingNextPage))) && (
        <LinearProgress />
      )}
      {!isPending && items.length === 0 && !hasNextPage && !isFetchingNextPage && (
        <div className="flex items-center flex-col gap-4 pt-16">
          <UilMinusCircle className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          <div className="text-gray-600 dark:text-gray-400 text-lg">
            {i18next.t("g.empty-list")}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {i18next.t("post-templates.empty-list-hint")}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 my-4">
        {items.map((item) => (
          <PostTemplatesListItem
            item={item}
            confirmApply={confirmApply}
            onApply={() => onApply(item)}
            key={item._id}
          />
        ))}
        {hasNextPage && (
          <div className="flex justify-center my-4">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              isLoading={isFetchingNextPage}
            >
              {isFetchingNextPage ? i18next.t("g.loading") : i18next.t("post-templates.load-more")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
