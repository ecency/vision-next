"use client";

import { useCallback, useMemo, useState } from "react";
import {
  SignupByWalletStepperSteps,
  SignupWalletConnectWallet,
  SignupWalletIntro,
  SignupWalletStepper
} from "./_components";
import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { SignupWalletValidation } from "./_components/steps/signup-wallet-validation";
import { useMap } from "react-use";
import { ExternalWalletCurrency } from "@/enums";
import { SignupExternalWalletInformation } from "./types";

export default function SignupByWalletPage() {
  const [wallets, { set }] =
    useMap<Record<ExternalWalletCurrency, SignupExternalWalletInformation>>();

  const [step, setStep] = useState(SignupByWalletStepperSteps.INTRO);

  const hasAtLeastOneWallet = useMemo(() => Object.values(wallets).length > 0, [wallets]);
  const isContinueDisabled = useMemo(
    () => step !== SignupByWalletStepperSteps.INTRO && !hasAtLeastOneWallet,
    [hasAtLeastOneWallet, step]
  );

  const back = useCallback(() => {
    switch (step) {
      case SignupByWalletStepperSteps.VALIDATION:
        setStep(SignupByWalletStepperSteps.CI);
        break;
      case SignupByWalletStepperSteps.CREATE_ACCOUNT:
        setStep(SignupByWalletStepperSteps.VALIDATION);
        break;
      case SignupByWalletStepperSteps.CI:
      default:
        setStep(SignupByWalletStepperSteps.INTRO);
    }
  }, [step]);

  const next = useCallback(() => {
    if (isContinueDisabled) {
      return;
    }

    switch (step) {
      case SignupByWalletStepperSteps.VALIDATION:
        setStep(SignupByWalletStepperSteps.CREATE_ACCOUNT);
        break;
      case SignupByWalletStepperSteps.INTRO:
        setStep(SignupByWalletStepperSteps.CI);
        break;
      case SignupByWalletStepperSteps.CI:
        setStep(SignupByWalletStepperSteps.VALIDATION);
        break;
      case SignupByWalletStepperSteps.CREATE_ACCOUNT:
      default:
        setStep(SignupByWalletStepperSteps.INTRO);
    }
  }, [isContinueDisabled, step]);

  return (
    <div className="container mx-auto flex flex-col gap-4 md:gap-8 lg:gap-10 xl:gap-12 min-h-[90vh] items-center">
      <SignupWalletStepper step={step} />

      <div className="flex flex-col max-w-[800px] w-full justify-center bg-white p-4 sm:px-6 md:px-8 rounded-xl">
        <div className="flex items-center bg-white z-10 justify-between sticky top-0 py-4">
          {step !== SignupByWalletStepperSteps.INTRO && (
            <Button
              noPadding={true}
              icon={<UilArrowLeft />}
              size="sm"
              iconPlacement="left"
              appearance="gray-link"
              onClick={back}
            >
              {i18next.t("g.back")}
            </Button>
          )}
          {step === SignupByWalletStepperSteps.INTRO && <div />}

          <Button size="sm" onClick={next} disabled={isContinueDisabled}>
            Continue
          </Button>
        </div>

        {step === SignupByWalletStepperSteps.INTRO && <SignupWalletIntro />}
        {step === SignupByWalletStepperSteps.CI && (
          <SignupWalletConnectWallet onSuccess={(currency, wallet) => set(currency, wallet)} />
        )}
        {step === SignupByWalletStepperSteps.VALIDATION && (
          <SignupWalletValidation wallets={wallets} />
        )}
      </div>
    </div>
  );
}
