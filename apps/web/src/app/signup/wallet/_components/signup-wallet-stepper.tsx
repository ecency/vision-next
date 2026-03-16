import { Stepper } from "@/features/shared";
import {
  UilUser,
  UilWallet,
  UilCheckCircle
} from "@tooni/iconscout-unicons-react";

export enum MetamaskSignupStep {
  INTRO,
  CONNECT,
  CREATE_ACCOUNT
}

interface Props {
  step: MetamaskSignupStep;
}

const steps = [
  {
    step: MetamaskSignupStep.INTRO,
    title: "Username",
    icon: <UilUser />,
    description: "Select your Hive username"
  },
  {
    step: MetamaskSignupStep.CONNECT,
    title: "Connect & Verify",
    icon: <UilWallet />,
    description: "Connect MetaMask and verify wallet balance"
  },
  {
    step: MetamaskSignupStep.CREATE_ACCOUNT,
    title: "Create Account",
    icon: <UilCheckCircle />,
    description: "Finalize your Hive account"
  }
];

export function SignupWalletStepper({ step: stepProp }: Props) {
  return <Stepper steps={steps} currentStep={stepProp} />;
}
