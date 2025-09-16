import { PollSnapshot } from "@/features/polls";

export function normalizePollSnapshot(poll?: PollSnapshot | null): PollSnapshot | undefined {
  if (!poll) {
    return undefined;
  }

  const rawEndTime = poll.endTime as unknown;
  const parsedEndTime =
    rawEndTime instanceof Date
      ? rawEndTime
      : typeof rawEndTime === "string" || typeof rawEndTime === "number"
        ? new Date(rawEndTime)
        : new Date();
  const endTime = Number.isNaN(parsedEndTime.getTime()) ? new Date() : parsedEndTime;

  const choices = Array.isArray(poll.choices) ? poll.choices : [];
  const normalizedMaxChoices =
    typeof poll.maxChoicesVoted === "number" && poll.maxChoicesVoted > 0
      ? poll.maxChoicesVoted
      : Math.min(Math.max(1, choices.length), choices.length || 1);

  return {
    ...poll,
    choices,
    endTime,
    filters: {
      accountAge: poll.filters?.accountAge ?? 0
    },
    interpretation: poll.interpretation ?? "number_of_votes",
    maxChoicesVoted: normalizedMaxChoices,
    voteChange: poll.voteChange ?? true,
    hideVotes: poll.hideVotes ?? false
  };
}
