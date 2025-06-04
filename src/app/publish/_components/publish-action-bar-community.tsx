import { CommunitySelector } from "@/app/submit/_components";
import { isCommunity } from "@/utils";
import i18next from "i18next";
import { usePublishState } from "../_hooks";

export function PublishActionBarCommunity() {
  const { tags, setTags } = usePublishState();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags?.some((t) => isCommunity(t)) && (
        <span className="text-sm opacity-50 hidden sm:block">
          {i18next.t("decks.threads-form.thread-host")}
        </span>
      )}
      <CommunitySelector
        tags={tags ?? []}
        onSelect={(prev, next) => {
          if (!next) {
            return;
          }

          const current = tags?.filter((tag) => tag !== next) ?? [];
          if (next?.startsWith("hive-")) {
            // In case of existing community have to clear it
            if (current[0]?.startsWith("hive-")) {
              current.shift();
            }
            current.unshift(next);
          } else {
            current.push(next);
          }
          setTags(current);
        }}
      />
    </div>
  );
}
