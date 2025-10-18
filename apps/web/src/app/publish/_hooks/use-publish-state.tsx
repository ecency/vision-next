import {
  SUBMIT_DESCRIPTION_MAX_LENGTH,
  SUBMIT_TAG_MAX_LENGTH,
  SUBMIT_TITLE_MAX_LENGTH
} from "@/app/submit/_consts";
import { BeneficiaryRoute, Entry } from "@/entities";
import { extractMetaData } from "@/utils";
import dayjs from "@/utils/dayjs";
import { postBodySummary } from "@ecency/render-helper";
import { ThreeSpeakVideo } from "@ecency/sdk";
import i18next from "i18next";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import isEqual from "react-fast-compare";
import { usePublishPollState } from "./use-publish-poll-state";

interface PublishStateContextValue {
  title: string;
  content: string;
  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  reward: string;
  setReward: (value: string) => void;
  beneficiaries: BeneficiaryRoute[];
  setBeneficiaries: (value: BeneficiaryRoute[]) => void;
  metaDescription: string;
  setMetaDescription: (value: string) => void;
  schedule: Date | undefined;
  setSchedule: (value: Date | undefined) => void;
  clearSchedule: () => void;
  tags: string[];
  setTags: (value: string[]) => void;
  thumbnails: string[];
  selectedThumbnail: string;
  setSelectedThumbnail: (value: string) => void;
  clearAll: () => void;
  isReblogToCommunity: boolean;
  setIsReblogToCommunity: (value: boolean) => void;
  poll: any;
  setPoll: (value: any) => void;
  createDefaultPoll: () => void;
  publishingVideo: ThreeSpeakVideo | undefined;
  setPublishingVideo: (value: ThreeSpeakVideo | undefined) => void;
  clearPublishingVideo: () => void;
  postLinks: Entry[];
  setPostLinks: (value: Entry[]) => void;
  setEntryImages: (value: string[]) => void;
  location:
    | {
        coordinates: { lng: number; lat: number };
        address?: string;
      }
    | undefined;
  setLocation: (
    value:
      | {
          coordinates: { lng: number; lat: number };
          address?: string;
        }
      | undefined
  ) => void;
  clearLocation: () => void;
  skipAutoThumbnailSelection: boolean;
  clearSelectedThumbnail: () => void;
}

const PublishStateContext = createContext<PublishStateContextValue | undefined>(undefined);

export function PublishStateProvider({ children }: { children: React.ReactNode }) {
  const [title, setStoredTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [reward, setReward] = useState<string>("default");
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRoute[]>([]);
  const [metaDescription, setStoredMetaDescription] = useState<string>("");
  const [schedule, setSchedule] = useState<Date | undefined>(undefined);
  const [tags, setStoredTags] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>("");
  const [skipAutoThumbnailSelection, setSkipAutoThumbnailSelection] = useState<boolean>(false);
  const [isReblogToCommunity, setIsReblogToCommunity] = useState<boolean>(false);
  const [publishingVideo, setPublishingVideo] = useState<ThreeSpeakVideo | undefined>(undefined);
  const [postLinks, setPostLinks] = useState<Entry[]>([]);
  const [entryImages, setEntryImages] = useState<string[]>([]);
  const [location, setLocation] = useState<
    | {
        coordinates: { lng: number; lat: number };
        address?: string;
      }
    | undefined
  >(undefined);
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

  return (
    <PublishStateContext.Provider
      value={{
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
      }}
    >
      {children}
    </PublishStateContext.Provider>
  );
}

export function usePublishState() {
  const context = useContext(PublishStateContext);
  if (context === undefined) {
    throw new Error("usePublishState must be used within a PublishStateProvider");
  }
  return context;
}
