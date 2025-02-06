import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { BeneficiaryRoute } from "@/entities";

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
    clearSchedule
  };
}
