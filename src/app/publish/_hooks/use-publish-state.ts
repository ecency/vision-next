import { BeneficiaryRoute, Entry } from "@/entities";
import { extractMetaData, useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { postBodySummary } from "@ecency/render-helper";
import { addDays } from "date-fns";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { usePublishPollState } from "./use-publish-poll-state";
import { ThreeSpeakVideo } from "@ecency/sdk";

export function usePublishState() {
  const params = useParams();

  // If there is any ID parameter which means we are in edit mode
  // then need to disable the persistent storage
  //const persistent = useMemo(() => !params.id, [params.id]);
  const persistent = true;

  // Persistent always true, handle publish and draft edits states with sessionId reset logic
  const [sessionId, setSessionId] = useSynchronizedLocalStorage<string>(
      PREFIX + "_pub_session_id",
      "",
      undefined,
      true // always persist
  );

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
  const [selectedThumbnail, setSelectedThumbnail] = useSynchronizedLocalStorage<string>(
    PREFIX + "_pub_sel_thumb",
    "",
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
  const [poll, setPoll, clearPoll] = usePublishPollState(persistent);

  const metadata = useMemo(() => extractMetaData(content ?? ""), [content]);
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
    if (!selectedThumbnail) {
      setSelectedThumbnail(thumbnails[0]);
    }
  }, [thumbnails]);

  const clearAll = useCallback(() => {
    setSessionId("");
    setTitle("");
    setContent("");
    setReward("default");
    setBeneficiaries([]);
    setMetaDescription("");
    setSchedule(undefined);
    setTags([]);
    setSelectedThumbnail("");
    clearPoll();
    clearPublishingVideo();
    clearPostLinks();
  }, [
    setSessionId,
    setBeneficiaries,
    setContent,
    setMetaDescription,
    setReward,
    setSchedule,
    setSelectedThumbnail,
    setTags,
    setTitle,
    clearPoll,
    clearPublishingVideo,
    clearPostLinks
  ]);

  return {
    sessionId,
    setSessionId,
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
    setPostLinks
  };
}
