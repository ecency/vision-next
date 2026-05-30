"use client";

import React, { useCallback, useState } from "react";
import i18next from "i18next";
import {
  UilArrowRight,
  UilCloudComputing,
  UilDraggabledots,
  UilPlusCircle
} from "@tooni/iconscout-unicons-react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { DECKS_INTRO_FEATURES } from "./decks-intro-features";

const TIPS = [
  { icon: <UilPlusCircle className="opacity-50" />, key: "add" },
  { icon: <UilDraggabledots className="opacity-50" />, key: "drag" },
  { icon: <UilCloudComputing className="opacity-50" />, key: "save" }
];

/**
 * One-time guided intro shown on the deck surface to first-time (logged-in)
 * users — the Decks equivalent of the /publish onboarding. Self-gates on a
 * localStorage flag so it appears once and never blocks returning users.
 */
export function DecksOnboarding() {
  const [show, setShow] = useSynchronizedLocalStorage(PREFIX + "_decks_onboarding_passed", true);
  const [step, setStep] = useState<"intro" | "build">("intro");

  const next = useCallback(() => {
    if (step === "intro") {
      setStep("build");
    } else {
      setShow(false);
    }
  }, [setShow, step]);

  return (
    <Modal
      centered={true}
      show={!!show}
      onHide={() => setShow(false)}
    >
      <ModalHeader closeButton={true}>
        {step === "build" && i18next.t("decks.onboarding.build-title")}
      </ModalHeader>
      <ModalBody>
        <div className="mx-auto flex flex-col gap-6 lg:gap-8 p-4">
          {step === "intro" && (
            <>
              <div className="text-2xl font-bold text-center">
                {i18next.t("decks.onboarding.title")}
              </div>
              <div className="flex flex-col gap-6">
                {DECKS_INTRO_FEATURES.map(({ icon, key }) => (
                  <div
                    className="grid gap-4 items-start"
                    key={key}
                    style={{ gridTemplateColumns: "max-content 1fr" }}
                  >
                    {icon}
                    <div className="-mt-1">
                      <div className="font-bold">
                        {i18next.t(`decks.intro.features.${key}-title`)}
                      </div>
                      <div className="opacity-75">
                        {i18next.t(`decks.intro.features.${key}-description`)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === "build" && (
            <div className="flex flex-col gap-6">
              {TIPS.map(({ icon, key }) => (
                <div
                  className="grid gap-4 items-start"
                  key={key}
                  style={{ gridTemplateColumns: "max-content 1fr" }}
                >
                  {icon}
                  <div className="-mt-1">
                    <div className="font-bold">
                      {i18next.t(`decks.onboarding.tips.${key}-title`)}
                    </div>
                    <div className="opacity-75">
                      {i18next.t(`decks.onboarding.tips.${key}-description`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="justify-center gap-4 flex p-4">
        <Button icon={<UilArrowRight />} onClick={next}>
          {step === "intro"
            ? i18next.t("decks.onboarding.button")
            : i18next.t("decks.onboarding.finish")}
        </Button>
        {step === "intro" && (
          <Button appearance="gray-link" onClick={() => setShow(false)}>
            {i18next.t("decks.onboarding.skip")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
