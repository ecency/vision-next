"use client";

import { useCallback, useState } from "react";
import {
  SignupByWalletStepperSteps,
  SignupWalletConnectWallet,
  SignupWalletIntro,
  SignupWalletStepper
} from "./_components";
import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

export default function SignupByWalletPage() {
  const [step, setStep] = useState(SignupByWalletStepperSteps.INTRO);

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

  return (
    <div className="container mx-auto flex flex-col gap-4 md:gap-8 lg:gap-10 xl:gap-12 min-h-[90vh] items-center">
      <SignupWalletStepper step={step} />

      <div className="flex flex-col max-w-[800px] w-full justify-center bg-white p-4 sm:p-6 md:p-8 rounded-xl">
        {step !== SignupByWalletStepperSteps.INTRO && (
          <div className="flex items-center justify-start mb-4">
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
          </div>
        )}
        {step === SignupByWalletStepperSteps.INTRO && (
          <SignupWalletIntro onNext={() => setStep(SignupByWalletStepperSteps.CI)} />
        )}
        {step === SignupByWalletStepperSteps.CI && <SignupWalletConnectWallet />}
      </div>
    </div>
  );
}
