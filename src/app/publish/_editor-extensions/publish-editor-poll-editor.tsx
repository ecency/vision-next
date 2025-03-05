import { Button, FormControl, InputGroup, TabItem } from "@/features/ui";
import { UilMultiply, UilPlus, UilQuestionCircle, UilTrash } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useState } from "react";
import { usePublishState } from "../_hooks";
import { PublishEditorPollEditorSettings } from "./publish-editor-poll-editor-settings";

export function PublishEditorPollEditor() {
  const { poll, setPoll } = usePublishState();

  const [tab, setTab] = useState<"details" | "settings">("details");

  return poll ? (
    <div id="publish-active-poll">
      <div className="flex items-center justify-between p-4">
        <div className="text-sm text-gray-400 dark:text-gray-600 font-bold uppercase">
          {i18next.t("polls.active-poll")}
        </div>
        <Button
          appearance="gray-link"
          size="sm"
          icon={<UilTrash />}
          onClick={() => setPoll(undefined)}
        />
      </div>

      <div className="border-b border-[--border-color] flex items-center text-center text-sm font-semibold">
        <TabItem
          isSelected={tab === "details"}
          name="details"
          i={0}
          onSelect={() => setTab("details")}
          title="Details"
        />
        <TabItem
          isSelected={tab === "settings"}
          name="settings"
          i={1}
          onSelect={() => setTab("settings")}
          title="Settings"
        />
      </div>

      {tab === "details" && (
        <div className="flex flex-col gap-4 mt-4 p-4">
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

          <div className="flex flex-col items-start gap-4 mt-4">
            <div>{i18next.t("polls.choices")}</div>

            <AnimatePresence>
              {poll.choices.map((choice, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  key={index}
                  className="flex w-full items-center gap-2"
                >
                  <FormControl
                    type="text"
                    value={choice}
                    placeholder={"Choice " + index}
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
                          choices: poll.choices.filter((c) => choice !== c)
                        })
                      }
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              appearance="gray"
              icon={<UilPlus />}
              onClick={() =>
                setPoll({
                  ...poll,
                  choices: [...poll.choices, ""]
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
