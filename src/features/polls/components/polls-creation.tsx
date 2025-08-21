import React, { useMemo } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "@ui/modal";
import { usePollsCreationManagement } from "../hooks";
import { FormControl, InputGroup } from "@ui/input";
import {
  UilCalender,
  UilClock,
  UilPanelAdd,
  UilPlus,
  UilQuestionCircle,
  UilSave,
  UilTrash,
  UilTrashAlt
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import dayjs from "@/utils/dayjs";
import i18next from "i18next";

export interface PollSnapshot {
  title: string;
  choices: string[];
  voteChange: boolean;
  hideVotes: boolean;
  maxChoicesVoted: number;
  filters: {
    accountAge: number;
  };
  endTime: Date;
  interpretation: "number_of_votes" | "tokens";
}

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  onAdd: (poll: PollSnapshot) => void;
  existingPoll?: PollSnapshot;
  onDeletePoll: () => void;
  readonly?: boolean;
}

export function PollsCreation({
  show,
  setShow,
  onAdd,
  existingPoll,
  onDeletePoll,
  readonly
}: Props) {
  const {
    title,
    setTitle,
    choices,
    pushChoice,
    deleteChoiceByIndex,
    updateChoiceByIndex,
    hasEmptyOrDuplicatedChoices,
    accountAge,
    setAccountAge,
    endDate,
    setEndDate,
    interpretation,
    setInterpretation,
    hideVotes,
    setHideVotes,
    voteChange,
    setVoteChange,
    isExpiredEndDate,
    endTime,
    setEndTime,
    maxChoicesVoted,
    setMaxChoicesVoted,
    clearAll
  } = usePollsCreationManagement(existingPoll);

  const formatDate = useMemo(
    () => dayjs(endDate ?? new Date()).format("YYYY-MM-DD"),
    [endDate]
  );
  const isInvalidEndTime = useMemo(
    () => !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime ?? ""),
    [endTime]
  );

  return (
    <Modal
      show={show}
      centered={true}
      onHide={() => setShow(false)}
      className="polls-creation-modal"
    >
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t(existingPoll ? "polls.edit-title" : "polls.title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-6">
          <InputGroup prepend={<UilQuestionCircle />}>
            <FormControl
              disabled={readonly}
              placeholder={i18next.t("polls.title-placeholder")}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </InputGroup>
          <div className="grid grid-cols-2 items-start gap-4">
            <InputGroup prepend={<UilCalender />}>
              <FormControl
                disabled={readonly}
                placeholder={i18next.t("polls.title-placeholder")}
                type="date"
                value={formatDate}
                onChange={(e: any) => setEndDate(new Date(e.target.value))}
              />
            </InputGroup>

            <div>
              <InputGroup prepend={<UilClock />}>
                <FormControl
                  disabled={readonly}
                  placeholder="00:00"
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </InputGroup>
              {isInvalidEndTime && (
                <div className="text-xs pt-1 px-3 text-red mx-auto">
                  {i18next.t("polls.invalid-time")}
                </div>
              )}
            </div>
          </div>
          {isExpiredEndDate && !readonly && (
            <div className="text-xs pt-1 px-3 text-red mx-auto">
              {i18next.t("polls.expired-date")}
            </div>
          )}

          <div className="flex flex-col gap-4 items-start mb-6">
            <div>{i18next.t("polls.choices")}</div>
            {choices?.map((choice, key) => (
              <div key={key} className="w-full flex items-center gap-4">
                <InputGroup prepend={key + 1}>
                  <FormControl
                    disabled={readonly}
                    placeholder={i18next.t("polls.choice-placeholder", { n: key + 1 })}
                    type="text"
                    value={choice}
                    onChange={(e) => updateChoiceByIndex(e.target.value, key)}
                  />
                </InputGroup>
                <Button
                  disabled={readonly}
                  size="sm"
                  onClick={() => deleteChoiceByIndex(key)}
                  appearance="gray-link"
                  icon={<UilTrash />}
                />
              </div>
            ))}
          </div>
          {hasEmptyOrDuplicatedChoices && !readonly && (
            <div className="text-sm opacity-75 text-center pb-4">
              {i18next.t("polls.polls-form-hint")}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 items-start">
          <div>{i18next.t("polls.options")}</div>
          <div className="text-sm opacity-50">{i18next.t("polls.account-age")}</div>
          <FormControl
            placeholder="100"
            type="number"
            min={0}
            max={200}
            value={accountAge}
            disabled={readonly}
            onChange={(e) => {
              const value = +e.target.value;
              if (value >= 0 && value <= 200) {
                setAccountAge(+e.target.value);
              } else if (value < 0) {
                setAccountAge(0);
              } else {
                setAccountAge(200);
              }
            }}
          />
          <div className="text-sm opacity-50">{i18next.t("polls.max-choices-voted")}</div>
          <div className="w-full flex items-center gap-2 justify-between">
            <FormControl
              placeholder="1"
              type="number"
              min={0}
              max={choices?.length ?? 1}
              value={maxChoicesVoted}
              disabled={readonly}
              onChange={(e) => {
                const value = +e.target.value;
                if (value >= 0 && value <= (choices?.length ?? 1)) {
                  setMaxChoicesVoted(+e.target.value);
                } else if (value < 0) {
                  setMaxChoicesVoted(1);
                } else {
                  setMaxChoicesVoted(choices?.length ?? 1);
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => setMaxChoicesVoted(choices?.length ?? 1)}
              appearance="gray-link"
            >
              {i18next.t("g.all")}
            </Button>
          </div>
          <FormControl
            disabled={readonly}
            type="select"
            value={interpretation}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setInterpretation(e.target.value as PollSnapshot["interpretation"])
            }
          >
            <option value="number_of_votes">{i18next.t("polls.number_of_votes")}</option>
            <option value="tokens">{i18next.t("polls.tokens")}</option>
          </FormControl>
          <FormControl
            disabled={readonly}
            type="checkbox"
            label={i18next.t("polls.vote-change")}
            checked={!!voteChange}
            onChange={(e: boolean) => setVoteChange(e)}
          />
          <FormControl
            disabled={readonly}
            type="checkbox"
            label={i18next.t("polls.current-standing")}
            checked={!!hideVotes}
            onChange={(e: boolean) => setHideVotes(e)}
          />
          <Button
            onClick={() => clearAll()}
            outline={true}
            size="sm"
            icon={<UilTrashAlt />}
            className="mt-4"
          >
            {i18next.t("g.reset-form")}
          </Button>
        </div>
      </ModalBody>
      <ModalFooter sticky={true}>
        <div className="flex justify-between">
          <Button
            disabled={readonly}
            icon={<UilPlus />}
            iconPlacement="left"
            onClick={() => pushChoice("")}
            outline={true}
          >
            {i18next.t("polls.add-choice")}
          </Button>
          <div className="flex gap-2">
            {existingPoll && (
              <Button
                disabled={readonly}
                appearance="danger"
                icon={<UilTrash />}
                iconPlacement="left"
                onClick={() => {
                  onDeletePoll();
                  setShow(false);
                }}
                outline={true}
              >
                {i18next.t("g.delete")}
              </Button>
            )}
            <Button
              icon={existingPoll ? <UilSave /> : <UilPanelAdd />}
              disabled={
                readonly ||
                hasEmptyOrDuplicatedChoices ||
                !title ||
                typeof accountAge !== "number" ||
                isExpiredEndDate ||
                isInvalidEndTime
              }
              iconPlacement="left"
              onClick={() => {
                if (title && endDate && choices && typeof accountAge === "number") {
                  const [hours, mins] = endTime?.split(":") ?? "00:00".split(":");

                  onAdd({
                    title,
                    endTime: dayjs(endDate)
                      .hour(+hours)
                      .minute(+mins)
                      .toDate(),
                    choices,
                    voteChange: !!voteChange,
                    hideVotes: !!hideVotes,
                    maxChoicesVoted: maxChoicesVoted ?? 1,
                    filters: {
                      accountAge
                    },
                    interpretation
                  });
                }
                setShow(false);
              }}
            >
              {existingPoll ? i18next.t("polls.update") : i18next.t("polls.attach")}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
