import useInterval from "react-use/lib/useInterval";
import * as bridgeApi from "@/api/bridge";
import { Entry } from "@/entities";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useEntryChecking(
  initialEntry: Entry | undefined,
  intervalStarted: boolean,
  onSuccessCheck: (entry: Entry) => void,
  customCondition?: (e1: Entry, e2: Entry | null) => boolean
) {
  const { activeUser } = useActiveAccount();

  const isLocal = ({ post_id }: Entry) => post_id === 1 || typeof post_id === "string" || !post_id;

  return useInterval(
    async () => {
      // Checking for transaction status
      if (initialEntry) {
        try {
          const entry = await bridgeApi.getPost(activeUser!.username, initialEntry.permlink);
          const isAlreadyAdded =
            initialEntry.permlink === entry?.permlink && !isLocal(initialEntry);
          const isCustomCondition = customCondition?.(initialEntry, entry ?? null) ?? true;
          if (entry && (!isAlreadyAdded || isCustomCondition)) {
            onSuccessCheck(entry);
          }
        } catch (e) {}
      }
    },
    intervalStarted ? 3000 : null
  );
}
