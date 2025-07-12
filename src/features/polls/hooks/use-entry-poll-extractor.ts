import { Entry, JsonPollMetadata } from "@/entities";
import { useMemo } from "react";
import { PollSnapshot } from "@/features/polls";

export function useEntryPollExtractor(entry?: Entry | null) {
  return useMemo(() => {
    if (
      entry &&
      typeof entry.json_metadata === "object" &&
      "content_type" in entry.json_metadata &&
      (entry.json_metadata as JsonPollMetadata).content_type === "poll"
    ) {
      return {
        title: (entry.json_metadata as JsonPollMetadata)?.question,
        choices: (entry.json_metadata as JsonPollMetadata)?.choices,
        endTime: new Date((entry.json_metadata as JsonPollMetadata)?.end_time * 1000),
        interpretation: (entry.json_metadata as JsonPollMetadata)?.preferred_interpretation,
        voteChange: (entry.json_metadata as JsonPollMetadata)?.vote_change ?? true,
        hideVotes: (entry.json_metadata as JsonPollMetadata)?.hide_votes ?? false,
        filters: {
          accountAge: (entry.json_metadata as JsonPollMetadata)?.filters?.account_age
        }
      } as PollSnapshot;
    }
    return undefined;
  }, [entry?.json_metadata]);
}
