"use client";

import {getDiscoverLeaderboardQuery, useClientActiveUser} from "@/api/queries";
import i18next from "i18next";
import { motion } from "framer-motion";
import { FollowControls, ProfileLink, UserAvatar } from "@/features/shared";
import { useMemo } from "react";
import { StyledTooltip } from "@ui/tooltip";
import { Button } from "@ui/button";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";
import { LeaderBoardItem } from "@/entities";

export function WaveFollowsCard() {
  const { data } = getDiscoverLeaderboardQuery("day").useClientQuery();
  const activeUser = useClientActiveUser();

  const items = useMemo(() => {
    if (!data) {
      return [];
    }

    const seen = new Set<string>();
    const result: LeaderBoardItem[] = [];

    while (result.length < 5 && seen.size < data.length) {
      const candidate = data[Math.floor(Math.random() * data.length)];
      if (candidate._id === activeUser?.username) continue;
      if (!seen.has(candidate._id)) {
        seen.add(candidate._id);
        result.push(candidate);
      }
    }

    return result;
  }, [data, activeUser]);


  return (
    <div className="rounded-2xl bg-white dark:bg-dark-200 p-4">
      <div className="font-semibold mb-6 flex justify-between items-center gap-4">
        <span>{i18next.t("waves.who-to-follow")}</span>
        <StyledTooltip content={i18next.t("waves.who-to-follow-hint")}>
          <Button icon={<UilInfoCircle />} size="xs" appearance="gray-link" />
        </StyledTooltip>
      </div>
      <div className="flex flex-col gap-4">
        {items?.map((item, i) => (
          <motion.div
            className="flex justify-between items-center gap-4 font-semibold"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i }}
            key={i}
          >
            <ProfileLink
              username={item._id}
              className="flex items-center gap-4 text-dark-default dark:text-white text-sm"
            >
              <UserAvatar size="medium" username={item._id} />
              <div>@{item._id}</div>
            </ProfileLink>
            <FollowControls targetUsername={item._id} where="chat-box"/>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
