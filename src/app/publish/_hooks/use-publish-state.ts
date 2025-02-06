import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { BeneficiaryRoute } from "@/entities";

export function usePublishState() {
  const [title, setTitle] = useSynchronizedLocalStorage<string>(PREFIX + "_pub_title");
  const [content, setContent] = useSynchronizedLocalStorage<string>(PREFIX + "pub_content");
  const [reward, setReward] = useSynchronizedLocalStorage<string>(PREFIX + "pub_reward");
  const [beneficiaries, setBeneficiaries] = useSynchronizedLocalStorage<BeneficiaryRoute[]>(
    PREFIX + "pub_beneficiaries",
    []
  );
  const [metaDescription, setMetaDescription] = useSynchronizedLocalStorage<string>(
    PREFIX + "pub_meta_desc"
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
    setMetaDescription
  };
}
