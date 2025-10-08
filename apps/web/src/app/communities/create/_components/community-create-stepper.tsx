import { UilLock, UilUnlock, UilUserCheck, UilUsersAlt } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

export enum CommunityStepperSteps {
  INTRO,
  CREATE_ACCOUNT,
  SIGN,
  CREATING,
  DONE
}

interface Props {
  step: CommunityStepperSteps;
}

const steps = [
  {
    step: CommunityStepperSteps.INTRO,
    title: "Community details",
    icon: <UilUsersAlt />,
    description: "Set community's title and description"
  },
  {
    step: CommunityStepperSteps.CREATE_ACCOUNT,
    title: "Credentials",
    icon: <UilLock />,
    description: "Generate and backup Hive credentials to manage community"
  },
  {
    step: CommunityStepperSteps.SIGN,
    title: "Sign operation",
    icon: <UilUnlock />,
    description: "Confirm community create operation with own key"
  },
  {
    step: CommunityStepperSteps.CREATING,
    title: "Updating community",
    icon: <UilUserCheck />,
    description: "Updating community settings and roles"
  }
] as const;

export function CommunityCreateStepper({ step: stepProp }: Props) {
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
