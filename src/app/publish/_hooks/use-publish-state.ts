import { extractMetaData, useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { BeneficiaryRoute } from "@/entities";
import { useCallback, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { postBodySummary } from "@ecency/render-helper";

export function usePublishState() {
  const params = useParams();

  // If there is any ID parameter which means we are in edit mode
  // then need to disable the persistent storage
  const persistent = useMemo(() => !params.id, [params.id]);

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
  const [schedule, setSchedule, clearSchedule] = useSynchronizedLocalStorage<Date>(
    PREFIX + "_pub_schedule",
    undefined,
    {
      raw: false,
      serializer: (value) => value.toISOString(),
      deserializer: (value) => new Date(value)
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

  const metadata = useMemo(() => extractMetaData(content ?? ""), [content]);
  const thumbnails = useMemo(() => metadata.thumbnails ?? [], [metadata.thumbnails]);

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
    setTitle("");
    setContent("");
    setReward("default");
    setBeneficiaries([]);
    setMetaDescription("");
    setSchedule(undefined);
    setTags([]);
    setSelectedThumbnail("");
  }, [
    setBeneficiaries,
    setContent,
    setMetaDescription,
    setReward,
    setSchedule,
    setSelectedThumbnail,
    setTags,
    setTitle
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
    setIsReblogToCommunity
  };
}
