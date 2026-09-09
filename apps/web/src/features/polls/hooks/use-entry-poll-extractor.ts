import { Entry, JsonPollMetadata } from "@/entities";
import { useMemo } from "react";
import { PollSnapshot } from "@/features/polls";

export function useEntryPollExtractor(entry?: Entry | null) {
  return useMemo(() => {
    if (
      entry &&
      entry.json_metadata &&
      typeof entry.json_metadata === "object" &&
      (entry.json_metadata as JsonPollMetadata).content_type === "poll"
    ) {
      const pollMetadata = entry.json_metadata as JsonPollMetadata;
      // Elements are rendered as React children and compared as choice keys;
      // an object element throws "Objects are not valid as a React child"
      // during SSR, so keep strings only (numbers/booleans would render but
      // are not valid choices either).
      const choices = (Array.isArray(pollMetadata?.choices) ? pollMetadata.choices : []).filter(
        (choice): choice is string => typeof choice === "string"
      );
      const endTime = new Date(Number(pollMetadata?.end_time) * 1000);
      const maxChoices =
        typeof pollMetadata?.max_choices_voted === "number" && pollMetadata.max_choices_voted > 0
          ? pollMetadata.max_choices_voted
          : (choices.length || 1);

      return {
        title: typeof pollMetadata?.question === "string" ? pollMetadata.question : "",
        choices,
        endTime,
        interpretation: pollMetadata?.preferred_interpretation as PollSnapshot["interpretation"],
        voteChange: pollMetadata?.vote_change ?? true,
        hideVotes: pollMetadata?.hide_votes ?? false,
        filters: {
          accountAge: pollMetadata?.filters?.account_age ?? 0
        },
        maxChoicesVoted: maxChoices
      } as PollSnapshot;
    }
    return undefined;
  }, [entry]);
}
