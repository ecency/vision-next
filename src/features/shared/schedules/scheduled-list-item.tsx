import React, { useMemo } from "react";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { PopoverConfirm } from "@ui/popover-confirm";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { FullAccount, Schedule } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { accountReputation, dateToFormatted, dateToFullRelative } from "@/utils";
import { UserAvatar } from "@/features/shared";
import { classNameObject } from "@ui/util";
import { Tooltip } from "@ui/tooltip";
import { alertCircleSvg, checkAllSvg, deleteForeverSvg, textBoxOutline, timeSvg } from "@ui/svg";
import i18next from "i18next";
import Image from "next/image";
import fallbackImage from "../../../../public/assets/fallback.png";
import noImage from "@/assets/img/noimage.svg";
import { useDeleteSchedule, useMoveSchedule } from "@/api/mutations";

interface Props {
  post: Schedule;
}

export function ScheduledListItem({ post }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const canUseWebp = useGlobalStore((state) => state.canUseWebp);

  const account = useMemo(() => activeUser?.data as FullAccount, [activeUser]);

  const author = account.name;
  const reputation = account.reputation;

  const tag = post.tags_arr[0] || "";
  const img = catchPostImage(post.body, 600, 500, canUseWebp ? "webp" : "match") || noImage;
  const summary = postBodySummary(post.body, 200);

  const dateRelative = useMemo(() => dateToFullRelative(post.schedule), [post]);
  const dateFormatted = useMemo(() => dateToFormatted(post.schedule), [post]);

  const { mutateAsync: moveSchedule, isPending: isScheduleMoving } = useMoveSchedule();
  const { mutateAsync: deleteSchedule, isPending: isScheduleDeleting } = useDeleteSchedule();

  return !activeUser?.data.__loaded ? null : (
    <div className="drafts-list-item border dark:border-dark-400 rounded-3xl overflow-hidden">
      <div className="flex items-center gap-3 border-b dark:border-dark-300 mb-4 p-2 bg-gray-100 dark:bg-dark-500">
        <div className="flex items-center gap-2">
          <UserAvatar username={author} size="medium" />
          <div className="flex items-center text-sm">
            <div className="font-bold">{author}</div>
            <div className="text-gray-600 dark:text-gray-400 pl-1">
              ({accountReputation(reputation)})
            </div>
          </div>
        </div>
        <Badge>{tag}</Badge>
        <div className="text-sm text-gray-600 dark:text-gray-400" title={dateFormatted}>
          {dateRelative}
        </div>
      </div>
      <div
        className="grid gap-4 p-2"
        style={{
          gridTemplateColumns: "150px 1fr"
        }}
      >
        <div className="w-full flex items-center justify-center border rounded-2xl aspect-[4/3] overflow-hidden">
          <Image
            alt={post.title}
            src={img}
            width={500}
            height={500}
            onError={(e: React.SyntheticEvent) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImage.src;
            }}
            className={classNameObject({
              "w-full h-auto": img !== noImage,
              "w-[40px] h-auto": img === noImage
            })}
          />
        </div>
        <div>
          <div className="text-gray-charcoal dark:text-white text-lg font-semibold">
            {post.title}
          </div>
          <div className="text-gray-steel dark:text-white-075">{summary}</div>
        </div>
      </div>
      <div className="flex justify-between items-center px-3 py-2">
        {post.status === 1 && (
          <Tooltip content={dateRelative}>
            <div className="flex items-center gap-3 text-gray-steel-light-005 dark:text-blue-metallic">
              <div className="w-[1.5rem]">{timeSvg}</div>
              <span className="text-xs">{dateFormatted}</span>
            </div>
          </Tooltip>
        )}
        {post.status === 2 && (
          <Tooltip content={dateRelative}>
            <div className="flex items-center gap-3 text-orange">
              <div className="w-[1.5rem]">{timeSvg}</div>
              <span className="text-xs">{dateFormatted}</span>
            </div>
          </Tooltip>
        )}
        {post.status === 3 && <div className="w-[1.5rem] ml-4 text-green">{checkAllSvg}</div>}
        {post.status === 4 && <div className="w-[1.5rem] ml-4 text-red">{alertCircleSvg}</div>}
        <div className="flex items-center gap-2 justify-end w-full">
          <PopoverConfirm
            titleText={`${i18next.t("schedules.move")}?`}
            onConfirm={() => moveSchedule({ id: post._id })}
          >
            <Button
              isLoading={isScheduleMoving}
              noPadding={true}
              appearance="link"
              title={i18next.t("schedules.move")}
              icon={textBoxOutline}
            />
          </PopoverConfirm>

          <PopoverConfirm onConfirm={() => deleteSchedule({ id: post._id })}>
            <Button
              isLoading={isScheduleDeleting}
              noPadding={true}
              appearance="link"
              title={i18next.t("g.delete")}
              icon={deleteForeverSvg}
            />
          </PopoverConfirm>
        </div>
      </div>
    </div>
  );
}
