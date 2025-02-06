import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";

export function usePublishState() {
  const [title, setTitle] = useSynchronizedLocalStorage<string>(PREFIX + "_pub_title");
  const [content, setContent] = useSynchronizedLocalStorage<string>(PREFIX + "pub_content");
  const [reward, setReward] = useSynchronizedLocalStorage<string>(PREFIX + "pub_reward");

  return {
    title,
    content,
    setTitle,
    setContent,
    reward,
    setReward
  };
}
