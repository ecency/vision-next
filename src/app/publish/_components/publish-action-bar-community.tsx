import { CommunitySelector } from "@/app/submit/_components";
import { Button } from "@/features/ui";
import { Dropdown, DropdownToggle } from "@/features/ui/dropdown";
import { UilUsersAlt } from "@tooni/iconscout-unicons-react";
import { usePublishState } from "../_hooks";
import i18next from "i18next";

export function PublishActionBarCommunity() {
  const { tags, setTags } = usePublishState();

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-sm opacity-50 hidden sm:block">
        {i18next.t("decks.threads-form.thread-host")}
      </span>
      <CommunitySelector
        tags={tags ?? []}
        onSelect={(prev, next) => {
          const nextTags = new Set(tags ?? []);
          if (prev) {
            nextTags.delete(prev);
          }
          if (next) {
            nextTags.add(next);
          }
          setTags(Array.from(nextTags));
        }}
      />
    </div>
  );
}
