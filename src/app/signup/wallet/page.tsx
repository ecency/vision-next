"use client";

import { useState } from "react";
import {
  SignupByWalletStepperSteps,
  SignupWalletConnectWallet,
  SignupWalletIntro,
  SignupWalletStepper
} from "./_components";

export default function SignupByWalletPage() {
  const [step, setStep] = useState(SignupByWalletStepperSteps.INTRO);

  return (
    <div className="container mx-auto flex flex-col gap-4 md:gap-8 lg:gap-10 xl:gap-12 min-h-[90vh] items-center">
      <SignupWalletStepper step={step} />

      <div className="flex flex-col justify-center bg-white p-4 sm:p-6 md:p-8 rounded-xl">
        {step === SignupByWalletStepperSteps.INTRO && (
          <SignupWalletIntro onNext={() => setStep(SignupByWalletStepperSteps.CI)} />
        )}
        {step === SignupByWalletStepperSteps.CI && <SignupWalletConnectWallet />}
      </div>
    </div>
  );
}
