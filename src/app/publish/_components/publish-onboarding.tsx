"use client";

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { UilArrowRight, UilEdit, UilFocus, UilWindow } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useState } from "react";
import { OnboardingFrame } from "../_frames";
import {
  PublishOnboardingPosting,
  PublishOnboardingSettings,
  PublishOnboardingSingleView,
  PublishOnboardingToolbar
} from "./onboarding";
import { PublishOnboardingSuccess } from "./onboarding/publish-onboarding-success";

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
        break;
      case "finish":
      default:
        setShow(false);
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
          {step === "single-view" && <PublishOnboardingSingleView />}
          {step === "toolbar" && <PublishOnboardingToolbar />}
          {step === "settings" && <PublishOnboardingSettings />}
          {step === "posting" && <PublishOnboardingPosting />}
          {step === "finish" && <PublishOnboardingSuccess />}
        </div>
      </ModalBody>
      <ModalFooter className="justify-center gap-4 flex p-4">
        <Button icon={<UilArrowRight />} onClick={next}>
          {step === "intro"
            ? i18next.t("publish.get-started.button")
            : step === "finish"
              ? i18next.t("g.finish")
              : i18next.t("g.continue")}
        </Button>
        {step !== "finish" && (
          <Button appearance="gray-link" onClick={() => setShow(false)}>
            {i18next.t("publish.get-started.skip")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
