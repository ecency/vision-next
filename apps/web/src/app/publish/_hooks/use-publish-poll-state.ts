import { PollSnapshot } from "@/features/polls";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";

export function usePublishPollState(persistent: boolean) {
  return useSynchronizedLocalStorage<PollSnapshot | undefined>(
    PREFIX + "_pub_poll",
    undefined,
    {
      raw: false,
      deserializer: (value) => {
        if (value) {
          const parsedInstance = JSON.parse(value) as PollSnapshot;
          parsedInstance.endTime = new Date(parsedInstance.endTime);
          return parsedInstance;
        }
        return undefined;
      },
      serializer: (value) => (value ? JSON.stringify(value) : "")
    },
    persistent
  );
}
