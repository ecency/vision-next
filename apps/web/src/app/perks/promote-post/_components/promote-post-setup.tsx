import { withFeatureFlag } from "@/core/react-query";
import { getPointsQueryOptions, getPromotePriceQueryOptions, getSearchPathQueryOptions, getAccessToken } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EntryListItem, SuggestionList } from "@/features/shared";
import { Button, FormControl } from "@/features/ui";
import { UilTrashAlt } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useMemo, useState } from "react";
import { useDebounce } from "react-use";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  onSuccess: (path: string, duration: number) => void;
}

export function PromotePostSetup({ onSuccess }: Props) {
  const { activeUser } = useActiveAccount();

  const [path, setPath] = useState(activeUser ? `${activeUser.username}/` : "");
  const [pathQuery, setPathQuery] = useState("");
  const [debouncedPathQuery, setDebouncedPathQuery] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(7);

  const [author, permlink] = useMemo(() => path.split("/"), [path]);

  const accessToken = activeUser ? getAccessToken(activeUser.username) : "";

  const { data: activeUserPoints } = useQuery(
    withFeatureFlag(
      ({ visionFeatures }) => visionFeatures.points.enabled,
      getPointsQueryOptions(activeUser?.username)
    )
  );
  const { data: prices, isLoading: isPricesLoading } = useQuery({
    ...getPromotePriceQueryOptions(accessToken),
    select: (data) => data.sort((a, b) => a.duration - b.duration)
  });
  const { data: paths } = useQuery(getSearchPathQueryOptions(debouncedPathQuery));
  const { data: entry } = EcencyEntriesCacheManagement.getEntryQueryByPath(
    author,
    permlink
  ).useClientQuery();

  const isAmountMoreThanBalance = useMemo(() => {
    const price = prices?.find((p) => p.duration === selectedDuration);
    if (activeUserPoints && price) {
      return +activeUserPoints?.points < price.price;
    }
    return false;
  }, [activeUserPoints, prices, selectedDuration]);

  useDebounce(() => setPathQuery(path), 500, [path]);
  useDebounce(() => setDebouncedPathQuery(pathQuery), 500, [pathQuery]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="opacity-50">{i18next.t("redeem-common.balance")}:</div>
        <div className="text-blue-dark-sky">{activeUserPoints?.points ?? 0} POINTS</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        <div>
          <SuggestionList items={paths} renderer={(i) => i} onSelect={(v) => setPath(v)}>
            <FormControl
              type="text"
              value={pathQuery}
              onChange={(e) => setPathQuery(e.target.value.replace("@", "").replace("%40", ""))}
              placeholder={i18next.t("redeem-common.post-placeholder")}
              disabled={isPricesLoading}
            />
          </SuggestionList>
          {!path && <div className="py-2 text-sm opacity-50">{i18next.t("perks.no-post")}</div>}
          <AnimatePresence>
            {entry && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                className="border border-[--border-color] rounded-xl px-4 mt-2 relative"
              >
                <Button
                  appearance="gray"
                  size="xs"
                  icon={<UilTrashAlt />}
                  className="absolute z-10 top-2 right-2"
                  onClick={() => setPath("")}
                />
                <EntryListItem entry={entry} order={0} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {prices?.map(({ duration, price }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={clsx(
                "bg-gray-100 dark:bg-gray-900 border p-2 md:p-4 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800",
                duration === selectedDuration ? "border-blue-dark-sky" : "border-[--border-color]"
              )}
              onClick={() => setSelectedDuration(duration)}
            >
              <div>
                {duration} {duration === 1 ? i18next.t("g.day") : i18next.t("g.days")}
              </div>
              <div className="text-blue-dark-sky text-lg font-semibold">{price} POINTS</div>
            </motion.div>
          ))}
        </div>
        <div>
          {isAmountMoreThanBalance && (
            <small className="usd-balance bold block text-red mt-3">
              {i18next.t("market.more-than-balance")}
            </small>
          )}
        </div>
        <div className="flex md:col-span-2 justify-end">
          <Button
            size="sm"
            disabled={!path || isAmountMoreThanBalance}
            onClick={() => onSuccess(path, selectedDuration)}
          >
            {i18next.t("g.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
