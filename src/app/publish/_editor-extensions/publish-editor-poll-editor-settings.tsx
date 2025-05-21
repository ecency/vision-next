import { Button, FormControl } from "@/features/ui";
import i18next from "i18next";
import { usePublishState } from "../_hooks";
import { PollSnapshot } from "@/features/polls";

export function PublishEditorPollEditorSettings() {
  const { poll, setPoll } = usePublishState();

  return (
    <div className="p-4 gap-4 lg:gap-6 xl:gap-8 mt-4 grid grid-cols-1 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="text-sm opacity-50">{i18next.t("polls.account-age")}</div>
        <FormControl
          placeholder="100"
          type="number"
          min={0}
          max={200}
          value={poll?.filters?.accountAge}
          // disabled={readonly}
          onChange={(e) => {
            const value = +e.target.value;
            if (value >= 0 && value <= 200) {
              setPoll({
                ...poll,
                filters: {
                  accountAge: +e.target.value
                }
              } as PollSnapshot);
            } else if (value < 0) {
              setPoll({
                ...poll,
                filters: {
                  accountAge: 0
                }
              } as PollSnapshot);
            } else {
              setPoll({
                ...poll,
                filters: {
                  accountAge: 200
                }
              } as PollSnapshot);
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm opacity-50">{i18next.t("polls.max-choices-voted")}</div>
        <div className="w-full flex items-center gap-2 justify-between">
          <FormControl
            placeholder="1"
            type="number"
            min={0}
            max={poll?.choices?.length ?? 1}
            value={poll?.maxChoicesVoted}
            // disabled={readonly}
            onChange={(e) => {
              const value = +e.target.value;
              if (value >= 0 && value <= (poll?.choices?.length ?? 1)) {
                setPoll({
                  ...poll,
                  maxChoicesVoted: +e.target.value
                } as PollSnapshot);
              } else if (value < 0) {
                setPoll({
                  ...poll,
                  maxChoicesVoted: 1
                } as PollSnapshot);
              } else {
                setPoll({
                  ...poll,
                  maxChoicesVoted: poll?.choices?.length ?? 1
                } as PollSnapshot);
              }
            }}
          />
          <Button
            size="sm"
            onClick={() =>
              setPoll({
                ...poll,
                maxChoicesVoted: poll?.choices?.length ?? 1
              } as PollSnapshot)
            }
            appearance="gray-link"
          >
            {i18next.t("g.all")}
          </Button>
        </div>
      </div>

      <div>
        <FormControl
          // disabled={readonly}
          type="select"
          value={poll?.interpretation}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setPoll({
              ...poll,
              interpretation: e.target.value as PollSnapshot["interpretation"]
            } as PollSnapshot)
          }
        >
          <option value="number_of_votes">{i18next.t("polls.number_of_votes")}</option>
          <option value="tokens">{i18next.t("polls.tokens")}</option>
        </FormControl>
      </div>

      <div className="flex flex-col gap-2 items-start">
        <FormControl
          // disabled={readonly}
          type="checkbox"
          label={i18next.t("polls.vote-change")}
          checked={!!poll?.voteChange}
          onChange={(e: boolean) =>
            setPoll({
              ...poll,
              voteChange: e
            } as PollSnapshot)
          }
        />
        <FormControl
          // disabled={readonly}
          type="checkbox"
          label={i18next.t("polls.current-standing")}
          checked={!!poll?.hideVotes}
          onChange={(e: boolean) =>
            setPoll({
              ...poll,
              hideVotes: e
            } as PollSnapshot)
          }
        />
      </div>
    </div>
  );
}
