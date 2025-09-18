import { useGlobalStore } from "@/core/global-store";
import { Button, Modal, ModalBody, ModalHeader, TabItem } from "@/features/ui";
import { ThreeSpeakIntegration, ThreeSpeakVideo } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilMinusCircle, UilPlus, UilSync } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublishEditorVideoGalleryItem } from "./publish-editor-video-gallery-item";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  onUpload: () => void;
  hasAlreadyPublishingVideo: boolean;
  onAdd: (video: ThreeSpeakVideo, isNsfw: boolean) => void;
  filterOnly?: string;
}

export function PublishEditorVideoGallery({
  show,
  setShow,
  onUpload,
  onAdd,
  hasAlreadyPublishingVideo,
  filterOnly
}: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const username = activeUser?.username;

  const [tab, setTab] = useState("all");
  const [language, setLanguage] = useState(i18next.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => setLanguage(lng);
    i18next.on("languageChanged", handleLanguageChange);

    return () => {
      i18next.off("languageChanged", handleLanguageChange);
    };
  }, []);

  const tabs = useMemo(
    () => [
      {
        label: i18next.t("video-gallery.all"),
        value: "all"
      },
      {
        label: i18next.t("video-gallery.published"),
        value: "published"
      },
      {
        label: i18next.t("video-gallery.encoding"),
        value: "encoding"
      },
      {
        label: i18next.t("video-gallery.encoded"),
        value: "publish_manual"
      },
      {
        label: i18next.t("video-gallery.failed"),
        value: "failed"
      },
      {
        label: i18next.t("video-gallery.status-deleted"),
        value: "deleted"
      }
    ],
    [language]
  );

  const { data, refetch, isFetching } = useQuery({
    ...ThreeSpeakIntegration.queries.getAccountVideosQueryOptions(username),
    enabled: !!username && show,
    refetchInterval: show ? 60000 : false,
    select: useCallback(
      (data: ThreeSpeakVideo[]) =>
        data?.filter(({ status }) => (tab === "all" ? true : status === tab)),
      [tab]
    )
  });

  useEffect(() => {
    if (filterOnly) {
      setTab(filterOnly);
    }
  }, [filterOnly]);

  return (
    <Modal centered={true} size="lg" show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true}>{i18next.t("video-gallery.title")}</ModalHeader>
      <ModalBody>
        <div className="flex items-center justify-between border-b border-[--border-color] -mx-3 px-3">
          <div className="flex overflow-x-auto no-scrollbar text-sm font-semibold">
            {tabs.filter((tab) => (filterOnly ? filterOnly === tab.value : true)).map(
              ({ label, value }, i) => (
                <TabItem
                  title={label}
                  name={value}
                  key={value}
                  i={i}
                  onSelect={() => setTab(value)}
                  isSelected={value === tab}
                />
              )
            )}
          </div>

          <Button
            appearance="gray-link"
            icon={<UilSync className="-scale-x-[1]" />}
            size="sm"
            disabled={!username || isFetching}
            className={isFetching ? "animate-spin" : ""}
            onClick={() => refetch()}
          />
        </div>
        <div className="text-sm py-4">{i18next.t("video-gallery.video-info")}</div>

        <div className="grid grid-col-1 sm:grid-cols-2 gap-2">
          {data?.map((item) => (
            <PublishEditorVideoGalleryItem
              hasAlreadyPublishingVideo={hasAlreadyPublishingVideo}
              video={item}
              key={item._id}
              onAdd={() => onAdd(item, false)}
              onAddNsfw={() => onAdd(item, true)}
            />
          ))}
        </div>

        {data?.length === 0 && (
          <div className="flex items-center flex-col gap-2 py-4 xl:py-10">
            <UilMinusCircle className="text-gray-400 dark:text-gray-600 w-12 h-12" />
            <div className="text-xl font-bold">{i18next.t("publish.video-gallery.no-data")}</div>
            <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
              {i18next.t("publish.video-gallery.no-data-hint")}
            </div>
            <Button className="mt-4" icon={<UilPlus />} onClick={onUpload}>
              {i18next.t("publish.video-gallery.no-data-button")}
            </Button>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
