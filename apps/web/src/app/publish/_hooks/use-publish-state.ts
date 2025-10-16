import {
  SUBMIT_DESCRIPTION_MAX_LENGTH,
  SUBMIT_TAG_MAX_LENGTH,
  SUBMIT_TITLE_MAX_LENGTH
} from "@/app/submit/_consts";
import { BeneficiaryRoute, Entry } from "@/entities";
import { extractMetaData, useSynchronizedState } from "@/utils";
import dayjs from "@/utils/dayjs";
import { postBodySummary } from "@ecency/render-helper";
import { ThreeSpeakVideo } from "@ecency/sdk";
import i18next from "i18next";
import { useCallback, useEffect, useMemo } from "react";
import isEqual from "react-fast-compare";
import { usePublishPollState } from "./use-publish-poll-state";

export function usePublishState() {
  const [title, setStoredTitle] = useSynchronizedState<string>("publish:title", "");
  const [content, setContent] = useSynchronizedState<string>("publish:content", "");
  const [reward, setReward] = useSynchronizedState<string>("publish:reward", "default");
  const [beneficiaries, setBeneficiaries] = useSynchronizedState<BeneficiaryRoute[]>(
    "publish:beneficiaries",
    []
  );
  const [metaDescription, setStoredMetaDescription] = useSynchronizedState<string>(
    "publish:metaDescription",
    ""
  );
  const [schedule, setSchedule] = useSynchronizedState<Date | undefined>(
    "publish:schedule",
    undefined
  );
  const [tags, setStoredTags] = useSynchronizedState<string[]>("publish:tags", []);
  const [selectedThumbnail, setSelectedThumbnail] = useSynchronizedState<string>(
    "publish:selectedThumbnail",
    ""
  );
  const [skipAutoThumbnailSelection, setSkipAutoThumbnailSelection] = useSynchronizedState<boolean>(
    "publish:skipAutoThumbnailSelection",
    false
  );
  const [isReblogToCommunity, setIsReblogToCommunity] = useSynchronizedState<boolean>(
    "publish:isReblogToCommunity",
    false
  );
  const [publishingVideo, setPublishingVideo] = useSynchronizedState<ThreeSpeakVideo | undefined>(
    "publish:publishingVideo",
    undefined
  );
  const [postLinks, setPostLinks] = useSynchronizedState<Entry[]>("publish:postLinks", []);
  const [entryImages, setEntryImages] = useSynchronizedState<string[]>("publish:entryImages", []);
  const [location, setLocation] = useSynchronizedState<
    | {
        coordinates: { lng: number; lat: number };
        address?: string;
      }
    | undefined
  >("publish:location", undefined);
  const [poll, setPoll] = usePublishPollState(false);

  const clearSchedule = useCallback(() => setSchedule(undefined), []);
  const clearSelectedThumbnail = useCallback(() => setSelectedThumbnail(""), []);
  const clearPublishingVideo = useCallback(() => setPublishingVideo(undefined), []);
  const clearPostLinks = useCallback(() => setPostLinks([]), []);
  const clearEntryImages = useCallback(() => setEntryImages([]), []);
  const clearLocation = useCallback(() => setLocation(undefined), []);
  const clearPoll = useCallback(() => setPoll(undefined), [setPoll]);

  const setTitle = useCallback(
    (value: string) => setStoredTitle(value.slice(0, SUBMIT_TITLE_MAX_LENGTH)),
    [setStoredTitle]
  );

  const setMetaDescription = useCallback(
    (value: string) => setStoredMetaDescription(value.slice(0, SUBMIT_DESCRIPTION_MAX_LENGTH)),
    [setStoredMetaDescription]
  );

  const sanitizeTags = useCallback((tagList: string[]) => {
    const trimmed = tagList.map((tag) => tag.slice(0, SUBMIT_TAG_MAX_LENGTH)).filter((tag) => tag);
    return Array.from(new Set(trimmed));
  }, []);

  const setTags = useCallback(
    (nextTags: string[]) => {
      setStoredTags(sanitizeTags(nextTags));
    },
    [sanitizeTags, setStoredTags]
  );

  useEffect(() => {
    if ((title?.length ?? 0) > SUBMIT_TITLE_MAX_LENGTH) {
      setTitle(title ?? "");
    }
  }, [setTitle, title]);

  useEffect(() => {
    if ((metaDescription?.length ?? 0) > SUBMIT_DESCRIPTION_MAX_LENGTH) {
      setMetaDescription(metaDescription ?? "");
    }
  }, [metaDescription, setMetaDescription]);

  useEffect(() => {
    const sanitized = sanitizeTags(tags ?? []);
    if (!isEqual(sanitized, tags)) {
      setStoredTags(sanitized);
    }
  }, [sanitizeTags, setStoredTags, tags]);

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
        title: i18next.t("polls.default-title"),
        choices: [
          i18next.t("polls.choice-placeholder", { n: 1 }),
          i18next.t("polls.choice-placeholder", { n: 2 })
        ],
        voteChange: true,
        hideVotes: false,
        maxChoicesVoted: 1,
        filters: {
          accountAge: 1
        },
        endTime: dayjs().add(1, "day").toDate(),
        interpretation: "number_of_votes"
      }),
    [poll, setPoll]
  );

  useEffect(() => {
    if (!metaDescription) {
      setMetaDescription(postBodySummary(content!, SUBMIT_DESCRIPTION_MAX_LENGTH));
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
    clearSchedule();
    setTags([]);
    setSelectedThumbnail("");
    setSkipAutoThumbnailSelection(false);
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
    clearSchedule,
    setTags,
    setTitle,
    setSelectedThumbnail,
    setSkipAutoThumbnailSelection,
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
