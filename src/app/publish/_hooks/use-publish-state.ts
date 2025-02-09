import { extractMetaData, useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { BeneficiaryRoute } from "@/entities";
import { useEffect, useMemo } from "react";

export function usePublishState() {
  const [title, setTitle] = useSynchronizedLocalStorage<string>(PREFIX + "_pub_title");
  const [content, setContent] = useSynchronizedLocalStorage<string>(PREFIX + "_pub_content");
  const [reward, setReward] = useSynchronizedLocalStorage<string>(PREFIX + "_pub_reward");
  const [beneficiaries, setBeneficiaries] = useSynchronizedLocalStorage<BeneficiaryRoute[]>(
    PREFIX + "_pub_beneficiaries",
    []
  );
  const [metaDescription, setMetaDescription] = useSynchronizedLocalStorage<string>(
    PREFIX + "_pub_meta_desc"
  );
  const [schedule, setSchedule, clearSchedule] = useSynchronizedLocalStorage<Date>(
    PREFIX + "_pub_schedule",
    undefined,
    {
      raw: false,
      serializer: (value) => value.toISOString(),
      deserializer: (value) => new Date(value)
    }
  );
  const [tags, setTags] = useSynchronizedLocalStorage<string[]>(PREFIX + "_pub_tags", []);
  const [selectedThumbnail, setSelectedThumbnail] = useSynchronizedLocalStorage<string>(
    PREFIX + "_pub_sel_thumb",
    ""
  );

  const metadata = useMemo(() => extractMetaData(content ?? ""), [content]);
  const thumbnails = useMemo(() => metadata.thumbnails ?? [], [metadata.thumbnails]);

  useEffect(() => {
    if (!selectedThumbnail) {
      setSelectedThumbnail(thumbnails[0]);
    }
  }, [thumbnails]);

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
    setSelectedThumbnail
  };
}
