import { CommunitySelector } from "@/app/submit/_components";
import { isCommunity } from "@/utils";
import i18next from "i18next";
import { usePublishState } from "../_hooks";
import { useMemo } from "react";

export function PublishActionBarCommunity() {
  const { tags, setTags, beneficiaries } = usePublishState();

  const beneficiaryReward = useMemo(
    () =>
      isCommunity(tags?.[0])
        ? beneficiaries?.find((ben) => ben.account === tags?.[0])?.weight
        : undefined,
    [beneficiaries, tags]
  );

  return (
    <div className="bg-white rounded-xl p-2 flex flex-wrap gap-1">
      <div className="text-sm opacity-50 pt-1.5">{i18next.t("decks.threads-form.thread-host")}</div>

      <div>
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
        {beneficiaryReward && (
          <div className="text-xs text-end text-blue-dark-sky">
            Community reward: {beneficiaryReward / 100}%
          </div>
        )}
      </div>
    </div>
  );
}
