import { useGlobalStore } from "@/core/global-store";
import { useCountdown } from "@/utils";
import { getGameStatusCheckQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useEffect, useMemo } from "react";

export function PerksPointsSpinCountdown() {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data, isFetching } = useQuery({
    ...getGameStatusCheckQueryOptions(activeUser?.username, "spin"),
    refetchOnMount: true
  });

  const [time, setTime] = useCountdown(0);

  const duration = useMemo(() => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return { hours, minutes, seconds };
  }, [time]);

  useEffect(() => {
    if (data?.wait_secs) {
      setTime(data.wait_secs);
    }
  }, [data, setTime]);

  return (
    <>
      {typeof data?.remaining !== "number"
        ? isFetching
          ? `${i18next.t("perks.next-spin")} __:__:__`
          : `${i18next.t("perks.next-spin")} ${duration.hours}:${duration.minutes}:${
              duration.seconds
            }`
        : i18next.t("perks.spin-now")}
    </>
  );
}
