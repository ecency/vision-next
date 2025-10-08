"use client";

import { EcencyWalletCurrency } from "@/features/wallet/sdk";
import { useState } from "react";
import {
  SignupByWalletStepperSteps,
  SignupWalletAccountCreating,
  SignupWalletIntro,
  SignupWalletStepper
} from "./_components";
import { SignupWalletValidateFunds } from "./_components/steps/signup-wallet-validate-funds";
import { WalletSeedPhrase, WalletSeedValidation } from "@/features/wallet";

/**
 * TODO add account to keychain if there is keychain available
 */
export default function SignupByWalletPage() {
  const [validatedWallet, setValidatedWallet] = useState<EcencyWalletCurrency>();
  const [step, setStep] = useState(SignupByWalletStepperSteps.INTRO);
  const [username, setUsername] = useState("");

  return (
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 lg:gap-10 xl:gap-12 items-start">
      <SignupWalletStepper step={step} />

      <div className="md:col-span-2 flex flex-col max-w-[800px] w-full justify-center bg-white px-4 py-8 sm:px-6 sm:py-10 md:px-8 rounded-xl">
        {step === SignupByWalletStepperSteps.INTRO && (
          <SignupWalletIntro
            initialUsername={username}
            username={username}
            setUsername={setUsername}
            onNext={() => setStep(SignupByWalletStepperSteps.SEED)}
          />
        )}
        {step === SignupByWalletStepperSteps.SEED && (
          <WalletSeedPhrase
            username={username}
            onValidated={() => setStep(SignupByWalletStepperSteps.VALIDATION)}
          />
        )}
        {step === SignupByWalletStepperSteps.VALIDATION && (
          <WalletSeedValidation
            username={username}
            onValidated={() => setStep(SignupByWalletStepperSteps.VALIDATE_FUNDS)}
          />
        )}
        {step === SignupByWalletStepperSteps.VALIDATE_FUNDS && (
          <SignupWalletValidateFunds
            username={username}
            onValid={(currency) => {
              setStep(SignupByWalletStepperSteps.CREATE_ACCOUNT);
              setValidatedWallet(currency);
            }}
          />
        )}
        {step === SignupByWalletStepperSteps.CREATE_ACCOUNT && validatedWallet && (
          <SignupWalletAccountCreating username={username} validatedWallet={validatedWallet} />
        )}
      </div>
    </div>
  );
}
