"use client";

import { useCallback, useMemo, useState } from "react";
import {
  SignupByWalletStepperSteps,
  SignupWalletAccountCreating,
  SignupWalletConnectWallet,
  SignupWalletIntro,
  SignupWalletStepper,
  SignupWalletValidation,
  SignupWalletSeedPhrase
} from "./_components";
import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useMap } from "react-use";
import { SignupExternalWalletInformation } from "./types";
import { EcencyWalletCurrency } from "@ecency/wallets";

/**
 * TODO add account to keychain if there is keychain available
 *      add redirect uri and return back with username
 */
export default function SignupByWalletPage() {
  const [wallets, { set, remove }] =
    useMap<Record<EcencyWalletCurrency, SignupExternalWalletInformation>>();

  const [validatedWallet, setValidatedWallet] = useState<{
    currency: EcencyWalletCurrency;
    address: string;
  }>();
  const [step, setStep] = useState(SignupByWalletStepperSteps.INTRO);
  const [username, setUsername] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const hasAtLeastOneWallet = useMemo(() => Object.values(wallets).length > 0, [wallets]);
  const isContinueDisabled = useMemo(
    () => (step === SignupByWalletStepperSteps.CI && !hasAtLeastOneWallet) || !username,
    [hasAtLeastOneWallet, step, username]
  );
  const isContinueShow = useMemo(
    () =>
      step !== SignupByWalletStepperSteps.SEED &&
      (step === SignupByWalletStepperSteps.INTRO || step === SignupByWalletStepperSteps.CI),
    [step]
  );

  const next = useCallback(() => {
    if (isContinueDisabled) {
      return;
    }

    switch (step) {
      case SignupByWalletStepperSteps.VALIDATION:
        setStep(SignupByWalletStepperSteps.CI);
        break;
      case SignupByWalletStepperSteps.INTRO:
        setStep(SignupByWalletStepperSteps.SEED);
        break;
      case SignupByWalletStepperSteps.SEED:
        setStep(SignupByWalletStepperSteps.VALIDATION);
        break;
      case SignupByWalletStepperSteps.CI:
        setStep(SignupByWalletStepperSteps.CREATE_ACCOUNT);
        break;
      case SignupByWalletStepperSteps.CREATE_ACCOUNT:
      default:
        setStep(SignupByWalletStepperSteps.INTRO);
    }
  }, [isContinueDisabled, step]);

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
          <SignupWalletSeedPhrase
            username={username}
            onValidated={() => setStep(SignupByWalletStepperSteps.VALIDATION)}
          />
        )}
        {step === SignupByWalletStepperSteps.CI && (
          <SignupWalletConnectWallet
            username={username}
            wallets={wallets}
            onSuccess={(currency, wallet) => {
              set(currency, wallet);
              if (currency === EcencyWalletCurrency.BTC) {
                setValidatedWallet({
                  currency,
                  address: wallet.address
                });
              }
            }}
            onClear={(currency) => remove(currency)}
          />
        )}
        {step === SignupByWalletStepperSteps.VALIDATION && (
          <SignupWalletValidation onValidated={next} />
        )}
        {step === SignupByWalletStepperSteps.CREATE_ACCOUNT && validatedWallet && (
          <SignupWalletAccountCreating
            username={username}
            validatedWallet={validatedWallet}
            onCreated={() => setIsFinished(true)}
          />
        )}
      </div>
    </div>
  );
}
