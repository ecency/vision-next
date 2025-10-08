import { Button, Popover, StyledTooltip } from "@/features/ui";
import { dateToFullRelative } from "@/utils";
import { proxifyImageSrc } from "@ecency/render-helper";
import { ThreeSpeakVideo } from "@ecency/sdk";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import i18next from "i18next";
import Image from "next/image";

interface Props {
  video: ThreeSpeakVideo;
  hasAlreadyPublishingVideo: boolean;
  onAdd: () => void;
  onAddNsfw: () => void;
}

function TooltipContent({ item }: { item: ThreeSpeakVideo }) {
  return (
    <div className="flex flex-col gap-2 p-2 text-xs">
      <div>
        {i18next.t("video-gallery.info-created")} {dateToFullRelative(item.created)}
      </div>
      {item.status === "published" && (
        <div>
          {i18next.t("video-gallery.info-views")} {item.views}
        </div>
      )}
      <div>
        {i18next.t("video-gallery.info-duration")} {`${item.duration}m`}
      </div>
      <div>
        {i18next.t("video-gallery.info-size")} {`${(item.size / (1024 * 1024)).toFixed(2)}MB`}
      </div>
    </div>
  );
}

function Status({ status, encodingProgress }: { status: string; encodingProgress: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={clsx(
          "w-2 h-2 rounded-lg",
          status === "publish_manual" && "bg-blue-dark-sky",
          status === "encoding_failed" && "bg-red",
          status === "published" && "bg-green",
          status === "deleted" && "bg-red",
          status === "encoding" && "bg-gray-600 dark:bg-gray-400 animate-ping"
        )}
      />
      {status === "publish_manual"
        ? i18next.t("video-gallery.status-encoded")
        : status === "encoding_failed"
          ? i18next.t("video-gallery.status-failed")
          : status === "published"
            ? i18next.t("video-gallery.status-published")
            : status === "deleted"
              ? i18next.t("video-gallery.status-deleted")
              : i18next.t("video-gallery.status-encoding")}
      {status == "encoding_ipfs" || status == "encoding_preparing"
        ? `${encodingProgress.toFixed(2)}%`
        : ""}
    </div>
  );
}

export function PublishEditorVideoGalleryItem({
  video,
  onAdd,
  onAddNsfw,
  hasAlreadyPublishingVideo
}: Props) {
  return (
    <div className="border border-[--border-color] rounded-xl overflow-hidden">
      <Image
        className="h-[256px] object-cover"
        width={600}
        height={500}
        src={proxifyImageSrc(video.thumbUrl, 600, 500, "match")}
        alt=""
      />
      <div className="flex flex-col p-2 gap-2 border-t border-[--border-color]">
        <div className="flex items-center justify-between">
          <Status status={video.status} encodingProgress={video.encodingProgress} />

          <Popover
            behavior="hover"
            directContent={
              <Button appearance="gray-link" noPadding={true} size="xs" icon={<UilInfoCircle />} />
            }
          >
            <TooltipContent item={video} />
          </Popover>
        </div>

        <div className="text-sm line-clamp-1 w-full">{video.title}</div>

        {["publish_manual", "published"].includes(video.status) && (
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <StyledTooltip
              content={
                hasAlreadyPublishingVideo &&
                video.status === "publish_manual" &&
                i18next.t("video-gallery.only-one-video")
              }
            >
              <Button
                full={true}
                size="sm"
                onClick={onAdd}
                disabled={hasAlreadyPublishingVideo && video.status === "publish_manual"}
              >
                {i18next.t("video-gallery.insert-video")}
              </Button>
            </StyledTooltip>
            {video.status === "published" && (
              <Button appearance="link" size="sm" onClick={onAddNsfw}>
                {i18next.t("video-gallery.insert-nsfw")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
