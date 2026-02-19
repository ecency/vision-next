import React, { useCallback, useMemo, useState } from "react";
import * as ls from "@/utils/local-storage";
import dayjs from "@/utils/dayjs";
import { Button } from "@ui/button";
import i18next from "i18next";
import { chevronDownSvgForSlider, chevronUpSvgForSlider } from "@ui/svg";
import { EntryTipBtn, FormattedCurrency } from "@/features/shared";
import { getVoteValue, setVoteValue } from "@/features/shared/entry-vote-btn/utils";
import { InputVote } from "@ui/input";
import { getDynamicPropsQueryOptions, votingPower, votingValue } from "@ecency/sdk";
import { Account, Entry } from "@/entities";
import { Spinner } from "@ui/spinner";
import { useActiveAccount } from "@/core/hooks";
import { useQuery } from "@tanstack/react-query";

type Mode = "up" | "down";

interface VoteDialogProps {
  account?: Account;
  entry: Entry;
  downVoted: boolean;
  upVoted: boolean;
  isPostSlider?: boolean;
  previousVotedValue: number | undefined;
  setTipDialogMounted: (d: boolean) => void;
  onClick: (percent: number, estimated: number) => void;
  handleClickAway: () => void;
  isVoted: { upVoted: boolean; downVoted: boolean };
  isVotingLoading: boolean;
}

export function EntryVoteDialog({
  entry,
  previousVotedValue,
  upVoted,
  isPostSlider,
  downVoted,
  onClick,
  isVoted,
  setTipDialogMounted,
  handleClickAway,
  account,
  isVotingLoading
}: VoteDialogProps) {
  const { username, account: activeAccount, isLoading: isAccountLoading } = useActiveAccount();
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

  const getUpVotedValue = useCallback(
    () =>
      getVoteValue(
        "up",
        username! + "-" + entry.post_id,
        getVoteValue("upPrevious", username!, 100, isPostSlider),
        isPostSlider
      ),
    [username, entry.post_id, isPostSlider]
  );
  const getDownVotedValue = useCallback(
    () =>
      getVoteValue(
        "down",
        username! + "-" + entry.post_id,
        getVoteValue("downPrevious", username!, -1, isPostSlider),
        isPostSlider
      ),
    [username, entry.post_id, isPostSlider]
  );

  const [mode, setMode] = useState<Mode>(downVoted ? "down" : "up");
  const [upSliderVal, setUpSliderVal] = useState(
    upVoted && previousVotedValue ? previousVotedValue : getUpVotedValue()
  );
  const [downSliderVal, setDownSliderVal] = useState(
    downVoted && previousVotedValue ? previousVotedValue : getDownVotedValue()
  );
  const [initialVoteValues, setInitialVoteValues] = useState({
    up: upVoted && previousVotedValue ? previousVotedValue : getUpVotedValue(),
    down: downVoted && previousVotedValue ? previousVotedValue : getDownVotedValue()
  });
  const [wrongValueUp, setWrongValueUp] = useState(false);
  const [wrongValueDown, setWrongValueDown] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const days = useMemo(() => {
    const createdDate = entry.created;
    const past = dayjs(createdDate);
    const now = dayjs();
    return now.diff(past, "day", true);
  }, [entry]);

  const upSliderChanged = useCallback(
    (value: number) => {
      const upSliderVal = Number(value.toFixed(1));
      setUpSliderVal(upSliderVal);
      setWrongValueUp(upSliderVal === initialVoteValues.up && upVoted);
      setShowRemove(upSliderVal === 0 && upVoted);
      setShowWarning(
        (upSliderVal < initialVoteValues.up || upSliderVal > initialVoteValues.up) &&
          upSliderVal > 0 &&
          upVoted
      );
    },
    [initialVoteValues.up, upVoted]
  );

  const downSliderChanged = useCallback(
    (value: number) => {
      const downSliderVal = Number(value.toFixed(1));
      setDownSliderVal(downSliderVal);
      setWrongValueDown(downSliderVal === initialVoteValues.down && downVoted);
      setShowRemove(downSliderVal === 0 && downVoted);
      setShowWarning(
        (downSliderVal > initialVoteValues.down || downSliderVal < initialVoteValues.down) &&
          downSliderVal < 0 &&
          downVoted
      );
    },
    [downVoted, initialVoteValues.down]
  );

  const estimate = (percent: number): number => {
    if (isAccountLoading || !activeAccount || !dynamicProps) {
      return 0;
    }

    const sign = percent < 0 ? -1 : 1;
    const vPower = votingPower(activeAccount) * 100; // 0-100 → 0-10000
    const weight = Math.abs(percent) * 100; // slider 0-100 → 0-10000

    return votingValue(activeAccount, dynamicProps, vPower, weight) * sign;
  };

  const upVoteClicked = useCallback(() => {
    const { upVoted } = isVoted;
    if (!upVoted || (upVoted && initialVoteValues.up !== upSliderVal)) {
      const estimated = Number(estimate(upSliderVal).toFixed(3));
      onClick(upSliderVal, estimated);
      setVoteValue("up", `${username!}-${entry.post_id}`, upSliderVal);
      setVoteValue("upPrevious", `${username!}-${entry.post_id}`, upSliderVal);
      setWrongValueUp(false);
      setWrongValueDown(false);
      ls.set(isPostSlider ? "post_upSlider_value" : "comment_upSlider_value", upSliderVal);
    } else if (upVoted && initialVoteValues.up === upSliderVal) {
      setWrongValueUp(true);
      setWrongValueDown(false);
    }
  }, [
    username,
    entry.post_id,
    estimate,
    initialVoteValues.up,
    isPostSlider,
    isVoted,
    onClick,
    upSliderVal
  ]);

  const downVoteClicked = useCallback(() => {
    const { downVoted } = isVoted;
    const downSliderValue = downSliderVal * -1;

    if (!downVoted || (downVoted && initialVoteValues.down !== downSliderValue)) {
      const estimated = Number(estimate(downSliderValue).toFixed(3));
      onClick(downSliderValue, estimated);
      setWrongValueDown(false);
      setWrongValueUp(false);
      setVoteValue("down", `${username!}-${entry.post_id}`, downSliderValue);
      setVoteValue("downPrevious", `${username!}-${entry.post_id}`, downSliderValue);
      ls.set(isPostSlider ? "post_downSlider_value" : "comment_downSlider_value", downSliderVal);
    } else if (downVoted && initialVoteValues.down === downSliderValue) {
      setWrongValueDown(true);
      setWrongValueUp(false);
    }
  }, [
    username,
    downSliderVal,
    entry.post_id,
    estimate,
    initialVoteValues.down,
    isPostSlider,
    isVoted,
    onClick
  ]);

  return (
    <>
      {mode === "up" && (
        <>
          <div className={`voting-controls voting-controls-up ${days > 7.0 ? "disable" : ""}`}>
            <Button
              noPadding={true}
              className="w-8"
              size="xs"
              icon={isVotingLoading ? <Spinner /> : chevronUpSvgForSlider}
              onClick={upVoteClicked}
              disabled={isVotingLoading}
              outline={true}
            />
            <div className="estimated">
              <FormattedCurrency value={estimate(upSliderVal)} fixAt={3} />
            </div>
            <div className="space" />
            <div className="slider slider-up">
              <InputVote value={upSliderVal} setValue={(x) => upSliderChanged(x)} />
            </div>
            <div className="percentage" />
            <Button
              noPadding={true}
              className="w-8"
              appearance="danger"
              outline={true}
              size="xs"
              icon={chevronDownSvgForSlider}
              onClick={() => setMode("down")}
            />
          </div>
          {wrongValueUp && (
            <div className="vote-error">
              <p>{i18next.t("entry-list-item.vote-error")}</p>
            </div>
          )}
          {showWarning && (
            <div className="vote-warning">
              <p>{i18next.t("entry-list-item.vote-warning")}</p>
            </div>
          )}
          {showRemove && (
            <div className="vote-remove">
              <p>{i18next.t("entry-list-item.vote-remove")}</p>
            </div>
          )}
        </>
      )}

      {mode === "down" && (
        <>
          <div className={`voting-controls voting-controls-down ${days > 7.0 ? "disable" : ""}`}>
            <Button
              noPadding={true}
              className="w-8"
              size="xs"
              icon={chevronUpSvgForSlider}
              onClick={() => setMode("up")}
              outline={true}
            />
            <div className="estimated">
              <FormattedCurrency value={estimate(downSliderVal)} fixAt={3} />
            </div>
            <div className="slider slider-down">
              <InputVote
                mode="negative"
                value={downSliderVal}
                setValue={(x) => downSliderChanged(x)}
              />
            </div>
            <div className="space" />
            <div className="percentage" />
            <Button
              noPadding={true}
              className="w-8"
              size="xs"
              appearance="danger"
              outline={true}
              icon={isVotingLoading ? <Spinner /> : chevronDownSvgForSlider}
              onClick={downVoteClicked}
              disabled={isVotingLoading}
            />
          </div>

          {wrongValueDown && (
            <div className="vote-error">
              <p>{i18next.t("entry-list-item.vote-error")}</p>
            </div>
          )}
          {showWarning && (
            <div className="vote-warning">
              <p>{i18next.t("entry-list-item.vote-warning")}</p>
            </div>
          )}
          {showRemove && (
            <div className="vote-remove">
              <p>{i18next.t("entry-list-item.vote-remove")}</p>
            </div>
          )}
        </>
      )}

      {days >= 7.0 && (
        <div className="vote-error error-message">
          <span>{i18next.t("entry-list-item.old-post-error")}</span>
          <span>{i18next.t("entry-list-item.old-post-error-suggestion")}</span>
          <div className="tipping-icon inline-flex">
            <EntryTipBtn
              account={account}
              entry={entry}
              setTipDialogMounted={setTipDialogMounted}
              handleClickAway={handleClickAway}
            />
          </div>
        </div>
      )}
    </>
  );
}
