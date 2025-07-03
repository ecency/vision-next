import { CommunitySelector } from "@/app/submit/_components";
import { isCommunity } from "@/utils";
import i18next from "i18next";
import { usePublishState } from "../_hooks";

export function PublishActionBarCommunity() {
  const { tags, setTags } = usePublishState();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {isCommunity(tags?.[0]) && (
        <span className="text-sm opacity-50 hidden sm:block">
          {i18next.t("decks.threads-form.thread-host")}
        </span>
      )}
      <CommunitySelector
        tags={tags ?? []}
        onSelect={(prev, next) => {
          if (next === null) {
            // Selecting "My blog"
            const updated = [...(tags ?? [])].filter((tag) => !tag.startsWith("hive-"));
            setTags(updated);
            return;
          }

          const current = tags?.filter((tag) => tag !== next) ?? [];

          if (next.startsWith("hive-")) {
            // Remove any existing hive- community tag
            const withoutHive = current.filter((tag) => !tag.startsWith("hive-"));
            setTags([next, ...withoutHive]);
          } else {
            setTags([...current, next]);
          }
        }}
      />
    </div>
  );
}
