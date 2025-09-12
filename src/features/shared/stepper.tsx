"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  steps: {
    step: string | number;
    title: string;
    icon: ReactNode;
    description: string;
  }[];
  currentStep: string | number;
}

export function Stepper({ steps, currentStep }: Props) {
  return (
    <div className="gap-4 lg:gap-6 hidden md:grid xl:gap-8 pt-8">
      <AnimatePresence>
        {steps.map(({ step, title, icon, description }, index) => (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: step === currentStep ? 1 : 0.5,
              transition: { delay: 0.1 * index }
            }}
            exit={{ opacity: 0 }}
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
