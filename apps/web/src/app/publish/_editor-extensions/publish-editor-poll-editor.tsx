import {
  Button,
  Datepicker,
  FormControl,
  InputGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TabItem
} from "@/features/ui";
import {
  UilCalender,
  UilMultiply,
  UilPlus,
  UilQuestionCircle,
  UilTrash
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useMemo, useRef, useState } from "react";
import { usePublishState } from "../_hooks";
import { PublishEditorPollEditorSettings } from "./publish-editor-poll-editor-settings";
import dayjs from "@/utils/dayjs";

export function PublishEditorPollEditor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { poll, setPoll } = usePublishState();

  const [showDatepicker, setShowDatePicker] = useState(false);
  const [tab, setTab] = useState<"details" | "settings">("details");

  const formattedEndTime = useMemo(
    () => (poll ? dayjs(poll.endTime).format("DD.MM.YYYY HH:mm") : ""),
    [poll]
  );

  return poll ? (
    <div id="publish-active-poll" className="contents">
      <div
        className="pointer bg-white -mx-2 border-t-[2px] border-[--border-color] flex items-center justify-between px-4 py-2 sticky bottom-0"
        onClick={() => rootRef.current?.scrollIntoView({ behavior: "smooth" })}
      >
        <div className="text-sm text-blue-dark-sky font-bold uppercase">
          {i18next.t("polls.active-poll")}
        </div>
        <Button
          appearance="gray-link"
          size="sm"
          icon={<UilTrash />}
          onClick={() => setPoll(undefined)}
          aria-label={i18next.t("polls.remove-poll", { defaultValue: "Remove poll" })}
        />
      </div>

      <div
        ref={rootRef}
        className="-mx-2 px-2 -mt-2 border-b border-[--border-color] flex items-center text-center text-sm font-semibold"
      >
        <TabItem
          isSelected={tab === "details"}
          name="details"
          i={0}
          onSelect={() => setTab("details")}
          title={i18next.t("polls.details")}
        />
        <TabItem
          isSelected={tab === "settings"}
          name="settings"
          i={1}
          onSelect={() => setTab("settings")}
          title={i18next.t("polls.settings")}
        />
      </div>

      {tab === "details" && (
        <div className="-mx-2 flex flex-col gap-4 mt-4 p-4">
          <InputGroup prepend={<UilQuestionCircle />}>
            <FormControl
              type="text"
              placeholder={i18next.t("polls.title-placeholder")}
              value={poll.title}
              onChange={(e) =>
                setPoll({
                  ...poll,
                  title: e.target.value
                })
              }
            />
          </InputGroup>
          <InputGroup prepend={<UilCalender />} onClick={() => setShowDatePicker(true)}>
            <FormControl
              type="text"
              readOnly={true}
              placeholder={i18next.t("polls.end-time")}
              value={formattedEndTime}
            />
          </InputGroup>

          <Modal show={showDatepicker} onHide={() => setShowDatePicker(false)} centered={true}>
            <ModalHeader closeButton={true}>{i18next.t("polls.end-time")}</ModalHeader>
            <ModalBody>
              <Datepicker
                value={poll?.endTime}
                minDate={dayjs().add(1, "hour").toDate()}
                onChange={(e) =>
                  setPoll({
                    ...poll,
                    endTime: e
                  })
                }
              />
            </ModalBody>
            <ModalFooter className="flex justify-end">
              <Button appearance="gray" size="sm" onClick={() => setShowDatePicker(false)}>
                {i18next.t("g.close")}
              </Button>
            </ModalFooter>
          </Modal>

          <div className="flex flex-col items-start gap-4 mt-4">
            <div>{i18next.t("polls.choices")}</div>

            {poll.choices.map((choice: string, index: number) => (
              <div key={index} className="animate-fade-in-up flex w-full items-center gap-2">
                <FormControl
                  type="text"
                  value={choice}
                  placeholder={i18next.t("polls.choice-placeholder", { n: index + 1 })}
                  onChange={(e) => {
                    const temp = [...poll?.choices];
                    temp[index] = e.target.value;
                    setPoll({
                      ...poll,
                      choices: temp
                    });
                  }}
                />
                {poll.choices.length > 2 && (
                  <Button
                    icon={<UilMultiply />}
                    size="sm"
                    appearance="gray-link"
                    onClick={() =>
                      setPoll({
                        ...poll,
                        choices: poll.choices.filter((_: string, i: number) => i !== index)
                      })
                    }
                    aria-label={i18next.t("polls.remove-choice", { defaultValue: "Remove choice" })}
                  />
                )}
              </div>
            ))}

            <Button
              appearance="gray"
              icon={<UilPlus />}
              onClick={() =>
                setPoll({
                  ...poll,
                  choices: [
                    ...poll.choices,
                    i18next.t("polls.choice-placeholder", {
                      n: poll.choices.length + 1
                    })
                  ]
                })
              }
            >
              {i18next.t("polls.add-choice")}
            </Button>
          </div>
        </div>
      )}

      {tab === "settings" && <PublishEditorPollEditorSettings />}
    </div>
  ) : (
    <></>
  );
}
