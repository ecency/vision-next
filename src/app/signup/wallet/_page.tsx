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
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useMap } from "react-use";
import { SignupExternalWalletInformation } from "./types";
import { EcencyWalletCurrency } from "@ecency/wallets";

/**
 * TODO add account to keychain if there is keychain available
 *      add redirect uri and return back with username
 */
export default function SignupByWalletPage() {
  const [wallets, { set }] =
    useMap<Record<EcencyWalletCurrency, SignupExternalWalletInformation>>();

  const [hasValidated, setHasValidated] = useState(false);
  const [step, setStep] = useState(SignupByWalletStepperSteps.INTRO);
  const [username, setUsername] = useState("");

  const hasAtLeastOneWallet = useMemo(() => Object.values(wallets).length > 0, [wallets]);
  const isContinueDisabled = useMemo(
    () => (step === SignupByWalletStepperSteps.CI && !hasAtLeastOneWallet) || !username,
    [hasAtLeastOneWallet, step, username]
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
        setStep(SignupByWalletStepperSteps.SEED);
        break;
      case SignupByWalletStepperSteps.SEED:
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
        setStep(SignupByWalletStepperSteps.SEED);
        break;
      case SignupByWalletStepperSteps.SEED:
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
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-10 xl:gap-12 items-start">
      <SignupWalletStepper step={step} />

      <div className="lg:col-span-2 flex flex-col max-w-[800px] w-full justify-center bg-white px-4 pt-4 pb-8 sm:px-6 sm:pb-10 md:px-8 rounded-xl">
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

          {(hasValidated || step !== SignupByWalletStepperSteps.VALIDATION) &&
            step !== SignupByWalletStepperSteps.CREATE_ACCOUNT && (
              <Button size="sm" onClick={next} disabled={isContinueDisabled}>
                Continue
              </Button>
            )}
        </div>

        {step === SignupByWalletStepperSteps.INTRO && (
          <SignupWalletIntro initialUsername={username} setUsername={setUsername} />
        )}
        {step === SignupByWalletStepperSteps.SEED && <SignupWalletSeedPhrase username={username} />}
        {step === SignupByWalletStepperSteps.CI && (
          <SignupWalletConnectWallet
            username={username}
            onSuccess={(currency, wallet) => set(currency, wallet)}
          />
        )}
        {step === SignupByWalletStepperSteps.VALIDATION && (
          <SignupWalletValidation wallets={wallets} onValidated={() => setHasValidated(true)} />
        )}
        {step === SignupByWalletStepperSteps.CREATE_ACCOUNT && (
          <SignupWalletAccountCreating username={username} />
        )}
      </div>
    </div>
  );
}
