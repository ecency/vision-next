import { useBroadcastMutation } from "@/modules/core";
import type { BroadcastMode, AuthContextV2 } from "@/modules/core";

export interface PollVotePayload {
  pollTrxId: string;
  choices: number[];
}

export function usePollVote(
  username: string | undefined,
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  return useBroadcastMutation<PollVotePayload>(
    ["polls", "vote"],
    username ?? "",
    ({ pollTrxId, choices }) => [
      [
        "custom_json",
        {
          id: "polls",
          required_auths: [],
          required_posting_auths: [username ?? ""],
          json: JSON.stringify({
            poll: pollTrxId,
            action: "vote",
            choices,
          }),
        },
      ],
    ],
    undefined,
    auth,
    "posting",
    { broadcastMode: broadcastMode ?? "async" }
  );
}
