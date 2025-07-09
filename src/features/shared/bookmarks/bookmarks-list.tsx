import { useClientActiveUser } from "@/api/queries";
import { LinearProgress } from "@/features/shared";
import { getActiveAccountBookmarksQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { BookmarkItem } from "./bookmark-item";

interface Props {
  onHide: () => void;
}

export function BookmarksList({ onHide }: Props) {
  const activeUser = useClientActiveUser();

  const { data, isLoading } = useQuery({
    ...getActiveAccountBookmarksQueryOptions(activeUser?.username),
    refetchOnMount: true,
    select: (data) => data?.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)) ?? []
  });

  return (
    <div className="dialog-content ">
      {isLoading && <LinearProgress />}
      {data && data.length > 0 && (
        <div className="dialog-list">
          <div className="grid grid-cols-1 gap-4">
            {data.map((item, i) => (
              <BookmarkItem i={i} key={item._id} author={item.author} permlink={item.permlink} />
            ))}
          </div>
        </div>
      )}
      {!isLoading && data?.length === 0 && (
        <div className="dialog-list">{i18next.t("g.empty-list")}</div>
      )}
    </div>
  );
}
