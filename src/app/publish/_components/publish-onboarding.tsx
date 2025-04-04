"use client";

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import {
  UilApple,
  UilEdit,
  UilFocus,
  UilMicrosoft,
  UilWindow
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useState } from "react";
import { OnboardingFrame } from "../_frames";

const featuresList = [
  {
    title: i18next.t("publish.get-started.single-view-title"),
    description: i18next.t("publish.get-started.single-view-description"),
    icon: <UilWindow className="opacity-50" />
  },
  {
    title: i18next.t("publish.get-started.dynamic-editor-title"),
    description: i18next.t("publish.get-started.dynamic-editor-description"),
    icon: <UilEdit className="opacity-50" />
  },
  {
    title: i18next.t("publish.get-started.focus-title"),
    description: i18next.t("publish.get-started.focus-description"),
    icon: <UilFocus className="opacity-50" />
  }
];

const shortcutsList = [
  {
    name: i18next.t("publish.action-bar.bold"),
    macKeys: "⌘+B",
    winKeys: "Ctrl+B"
  },
  {
    name: i18next.t("publish.action-bar.italic"),
    macKeys: "⌘+I",
    winKeys: "Ctrl+I"
  },
  {
    name: i18next.t("publish.action-bar.strikethrough"),
    macKeys: "⌘+Shift+S",
    winKeys: "Ctrl+Shift+S"
  }
];

export function PublishOnboarding() {
  const [show, setShow] = useSynchronizedLocalStorage(PREFIX + "_pub_onboarding_passed", true);
  const [step, setStep] = useState<
    "intro" | "single-view" | "toolbar" | "settings" | "posting" | "finish"
  >("intro");

  const next = useCallback(() => {
    switch (step) {
      case "intro":
        setStep("single-view");
        break;
      case "single-view":
        setStep("toolbar");
        break;
      case "toolbar":
        setStep("settings");
        break;
      case "settings":
        setStep("posting");
        break;
      case "posting":
        setStep("finish");
      default:
        null;
    }
  }, [step]);

  return (
    <Modal
      centered={true}
      show={show!}
      onHide={() => {
        setShow(false);
        setStep("intro");
      }}
    >
      <ModalHeader closeButton={true}>
        {step === "single-view" && i18next.t("publish.get-started.single-view-title")}
        {step === "toolbar" && i18next.t("publish.get-started.toolbar-title")}
        {step === "settings" && i18next.t("publish.get-started.settings-title")}
        {step === "posting" && i18next.t("publish.get-started.posting-title")}
      </ModalHeader>
      <ModalBody>
        <div className="mx-auto flex flex-col gap-6 lg:gap-12 p-4">
          {step === "intro" && (
            <>
              <div className="text-2xl font-bold text-center">
                {i18next.t("publish.get-started.title")}
              </div>
              <div className="flex flex-col gap-6 lg:gap-8">
                {featuresList.map(({ title, icon, description }, i) => (
                  <div
                    className="grid gap-4"
                    key={i}
                    style={{
                      gridTemplateColumns: "max-content 1fr"
                    }}
                  >
                    {icon}
                    <div className="-mt-2">
                      <div className="font-bold">{title}</div>
                      <div className="opacity-75">{description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {step !== "intro" && <OnboardingFrame step={step} />}
          {step === "single-view" && (
            <div className="pt-4 flex flex-col gap-2">
              <div className="font-bold">
                {i18next.t("publish.get-started.single-view-description")}
              </div>
              {i18next.t("publish.get-started.single-view-text")}
            </div>
          )}
          {step === "toolbar" && (
            <div className="pt-4 flex flex-col gap-2">
              <div className="font-bold">
                {i18next.t("publish.get-started.toolbar-description")}
              </div>
              {i18next.t("publish.get-started.toolbar-text")}
              <div className="pt-6">
                <div className="grid grid-cols-3 pb-2 border-b border-[--border-color] text-sm">
                  <div>{i18next.t("publish.get-started.shortcut")}</div>
                  <div className="flex items-center gap-2">
                    <UilApple className="w-4 h-4" />
                    Mac
                  </div>
                  <div className="flex items-center gap-2">
                    <UilMicrosoft className="w-4 h-4" />
                    Windows
                  </div>
                </div>
                {shortcutsList.map((shortcut) => (
                  <div
                    className="grid grid-cols-3 my-4 gap-2 text-xs items-center font-semibold"
                    key={shortcut.name}
                  >
                    <span>{shortcut.name} </span>
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded-lg">
                        {shortcut.macKeys}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded-lg">
                        {shortcut.winKeys}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="justify-center gap-4 flex p-4">
        <Button onClick={next}>
          {step === "intro" ? i18next.t("publish.get-started.button") : i18next.t("g.continue")}
        </Button>
        <Button appearance="gray-link" onClick={() => setShow(false)}>
          {i18next.t("publish.get-started.skip")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
