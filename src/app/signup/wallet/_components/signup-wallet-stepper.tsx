import {
  UilLock,
  UilMoneyBill,
  UilMoneyInsert,
  UilUser,
  UilWallet
} from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

export enum SignupByWalletStepperSteps {
  INTRO,
  SEED,
  CI, // Create/Import
  VALIDATION,
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
    description: "Explore how you can create Hive"
  },
  {
    step: SignupByWalletStepperSteps.SEED,
    title: "Seed phrase",
    icon: <UilLock />,
    description: "Create seed phrase for all wallets and Hive"
  },
  {
    step: SignupByWalletStepperSteps.CI,
    title: "Create or import a wallet",
    icon: <UilMoneyBill />,
    description: "Attach your wallet to the next Hive"
  },
  {
    step: SignupByWalletStepperSteps.VALIDATION,
    title: "Validate sufficient funds",
    icon: <UilMoneyInsert />,
    description: "Making sure that You are real person"
  },
  {
    step: SignupByWalletStepperSteps.CREATE_ACCOUNT,
    title: "Finish",
    icon: <UilUser />,
    description: "Get own account in Hive with 0.0 fee"
  }
] as const;

export function SignupWalletStepper({ step: stepProp }: Props) {
  return (
    <div className="grid-cols-1 gap-4 lg:gap-6 hidden md:grid xl:gap-8 pt-8">
      <AnimatePresence>
        {steps.map(({ step, title, icon, description }, index) => (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: step === stepProp ? 1 : 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 * index }}
            className={clsx("flex text-sm items-start gap-2 md:gap-4")}
            key={step}
          >
            <div className="bg-white dark:bg-dark-default p-2 rounded-xl">{icon}</div>
            <div>
              <div className="font-bold">{title}</div>
              <div className="opacity-75">{description}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
