import { BeneficiaryRoute, Entry } from "@/entities";
import { extractMetaData, useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { postBodySummary } from "@ecency/render-helper";
import { addDays } from "date-fns";
import { useParams } from "next/navigation";
import {useCallback, useEffect, useMemo} from "react";
import { usePublishPollState } from "./use-publish-poll-state";
import { ThreeSpeakVideo } from "@ecency/sdk";

export function usePublishState() {
  const params = useParams();
  const persistent = useMemo(() => !params?.id, [params]);

  const [title, setTitle] = useSynchronizedLocalStorage<string>(
    PREFIX + "_pub_title",
    "",
    undefined,
    persistent
  );
  const [content, setContent] = useSynchronizedLocalStorage<string>(
    PREFIX + "_pub_content",
    "",
    undefined,
    persistent
  );
  const [reward, setReward] = useSynchronizedLocalStorage<string>(
    PREFIX + "_pub_reward",
    "default",
    undefined,
    persistent
  );
  const [beneficiaries, setBeneficiaries] = useSynchronizedLocalStorage<BeneficiaryRoute[]>(
    PREFIX + "_pub_beneficiaries",
    [],
    undefined,
    persistent
  );
  const [metaDescription, setMetaDescription] = useSynchronizedLocalStorage<string>(
    PREFIX + "_pub_meta_desc",
    "",
    undefined,
    persistent
  );
  const [schedule, setSchedule, clearSchedule] = useSynchronizedLocalStorage<Date | undefined>(
    PREFIX + "_pub_schedule",
    undefined,
    {
      raw: false,
      serializer: (value) => value?.toISOString() ?? "",
      deserializer: (value) => {
        try {
          return new Date(value);
        } catch (e) {
          return undefined;
        }
      }
    },
    persistent
  );
  const [tags, setTags] = useSynchronizedLocalStorage<string[]>(
    PREFIX + "_pub_tags",
    [],
    undefined,
    persistent
  );
  const [selectedThumbnail, setSelectedThumbnail, clearSelectedThumbnail] =
    useSynchronizedLocalStorage<string>(PREFIX + "_pub_sel_thumb", "", undefined, persistent);
  const [skipAutoThumbnailSelection, setSkipAutoThumbnailSelection] =
      useSynchronizedLocalStorage<boolean>(
          PREFIX + "_pub_skip_auto_thumb",
          false,
          undefined,
          persistent
      );
  const [isReblogToCommunity, setIsReblogToCommunity] = useSynchronizedLocalStorage<boolean>(
    PREFIX + "_pub_reblog_to_community",
    false,
    undefined,
    persistent
  );
  const [publishingVideo, setPublishingVideo, clearPublishingVideo] =
    useSynchronizedLocalStorage<ThreeSpeakVideo>(
      PREFIX + "_pub_publishing_video",
      undefined,
      undefined,
      persistent
    );
  const [postLinks, setPostLinks, clearPostLinks] = useSynchronizedLocalStorage<Entry[]>(
    PREFIX + "_pub_post_links",
    [],
    {
      serializer: (val) => JSON.stringify(val),
      deserializer: (val) => JSON.parse(val),
      raw: false
    },
    persistent
  );
  const [entryImages, setEntryImages, clearEntryImages] = useSynchronizedLocalStorage<string[]>(
      PREFIX + "_pub_entry_images",
      [],
      {
        serializer: (val) => JSON.stringify(val),
        deserializer: (val) => {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? parsed : [];
          } catch {
            return [];
          }
        },
        raw: false
      },
      persistent
  );
  const [location, setLocation, clearLocation] = useSynchronizedLocalStorage<{
    coordinates: { lng: number; lat: number };
    address?: string;
  }>(
    PREFIX + "_pub_location",
    undefined,
    {
      serializer: (val) => JSON.stringify(val),
      deserializer: (val) => JSON.parse(val),
      raw: false
    },
    persistent
  );
  const [poll, setPoll, clearPoll] = usePublishPollState(persistent);

  //const metadata = useMemo(() => extractMetaData(content ?? ""), [content]);
  const metadata = useMemo(() => {
    const initialImage = selectedThumbnail
        ? [selectedThumbnail]
        : publishingVideo?.thumbUrl
            ? [publishingVideo.thumbUrl]
            : [];

    const mergedImages = Array.from(new Set([...initialImage, ...(entryImages ?? [])]));

    return extractMetaData(content ?? "", {
      image: mergedImages,
      thumbnails: mergedImages
    });
  }, [content, selectedThumbnail, publishingVideo, entryImages]);
  const thumbnails = useMemo(() => metadata.thumbnails ?? [], [metadata.thumbnails]);

  const createDefaultPoll = useCallback(
    () =>
      !poll &&
      setPoll({
        title: "My poll",
        choices: ["Choice 1", "Choice 2"],
        voteChange: true,
        hideVotes: false,
        maxChoicesVoted: 1,
        filters: {
          accountAge: 1
        },
        endTime: addDays(new Date(), 1),
        interpretation: "number_of_votes"
      }),
    [poll, setPoll]
  );

  useEffect(() => {
    if (!metaDescription) {
      setMetaDescription(postBodySummary(content!));
    }
  }, [content, metaDescription, setMetaDescription]);

  useEffect(() => {
    if (!selectedThumbnail && thumbnails.length && !skipAutoThumbnailSelection) {
      setSelectedThumbnail(thumbnails[0]);
    }
  }, [thumbnails, selectedThumbnail, skipAutoThumbnailSelection]);

  useEffect(() => {
    if (selectedThumbnail && skipAutoThumbnailSelection) {
      setSkipAutoThumbnailSelection(false);
    }
  }, [selectedThumbnail, skipAutoThumbnailSelection, setSkipAutoThumbnailSelection]);

  const _clearSelectedThumbnail = useCallback(() => {
    clearSelectedThumbnail();
    setSkipAutoThumbnailSelection(true);
  }, [clearSelectedThumbnail, setSkipAutoThumbnailSelection]);

  const clearAll = useCallback(() => {
    setTitle("");
    setContent("");
    setReward("default");
    setBeneficiaries([]);
    setMetaDescription("");
    setSchedule(undefined);
    setTags([]);
    clearSelectedThumbnail();
    clearPoll();
    clearPublishingVideo();
    clearPostLinks();
    clearEntryImages();
    clearLocation();
    setIsReblogToCommunity(false);
  }, [
    setBeneficiaries,
    setContent,
    setMetaDescription,
    setReward,
    setSchedule,
    clearSelectedThumbnail,
    setTags,
    setTitle,
    clearPoll,
    clearPublishingVideo,
    clearPostLinks,
    clearEntryImages,
    clearLocation,
    setIsReblogToCommunity
  ]);

  return {
    title,
    content,
    setTitle,
    setContent,
    reward,
    setReward,
    beneficiaries,
    setBeneficiaries,
    metaDescription,
    setMetaDescription,
    schedule,
    setSchedule,
    clearSchedule,
    tags,
    setTags,
    thumbnails,
    selectedThumbnail,
    setSelectedThumbnail,
    clearAll,
    isReblogToCommunity,
    setIsReblogToCommunity,
    poll,
    setPoll,
    createDefaultPoll,
    publishingVideo,
    setPublishingVideo,
    clearPublishingVideo,
    postLinks,
    setPostLinks,
    setEntryImages,
    location,
    setLocation,
    clearLocation,
    skipAutoThumbnailSelection,
    clearSelectedThumbnail: _clearSelectedThumbnail
  };
}
