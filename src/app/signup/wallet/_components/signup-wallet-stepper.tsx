import { Stepper } from "@/features/shared";
import {
  UilLock,
  UilMoneyInsert,
  UilUnlock,
  UilUser,
  UilWallet
} from "@tooni/iconscout-unicons-react";

export enum SignupByWalletStepperSteps {
  INTRO,
  SEED,
  CI, // Create/Import
  VALIDATION,
  VALIDATE_FUNDS,
  CREATE_ACCOUNT
}

interface Props {
  step: SignupByWalletStepperSteps;
}

const steps = [
  {
    step: SignupByWalletStepperSteps.INTRO,
    title: "Introduction",
    icon: <UilWallet />,
    description: "Select Hive username"
  },
  {
    step: SignupByWalletStepperSteps.SEED,
    title: "Seed phrase",
    icon: <UilLock />,
    description: "Generate and backup seed phrase for all wallets and Hive"
  },
  {
    step: SignupByWalletStepperSteps.VALIDATION,
    title: "Validate",
    icon: <UilUnlock />,
    description: "Verify that you have backed up seed phrase"
  },
  {
    step: SignupByWalletStepperSteps.VALIDATE_FUNDS,
    title: "Validate funds",
    icon: <UilMoneyInsert />,
    description: "Top-up one of wallets to validate"
  },
  {
    step: SignupByWalletStepperSteps.CREATE_ACCOUNT,
    title: "Finish",
    icon: <UilUser />,
    description: "Finalize Hive account creation"
  }
];

export function SignupWalletStepper({ step: stepProp }: Props) {
  return <Stepper steps={steps} currentStep={stepProp} />;
}
