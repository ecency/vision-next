"use client";

import { Feedback, LoginRequired, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { SetupExternalCreate, SetupExternalHeader, SetupExternalImport } from "./_components";
import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export default function WalletSetupExternalPage() {
  const [step, setStep] = useState<"intro" | "create" | "import">("intro");

  const options = useMemo(
    () =>
      step === "intro"
        ? [
            {
              title: i18next.t("profile-wallet.external-wallets-signup.create-wallet-title"),
              description: i18next.t(
                "profile-wallet.external-wallets-signup.create-wallet-description"
              ),
              buttonText: i18next.t("g.continue"),
              onClick: () => setStep("create")
            },
            {
              title: i18next.t("profile-wallet.external-wallets-signup.import-wallet-title"),
              description: i18next.t(
                "profile-wallet.external-wallets-signup.import-wallet-description"
              ),
              buttonText: i18next.t("waves.promote.coming-soon"),
              onClick: () => setStep("import"),
              disabled: true
            }
          ]
        : [],
    [step]
  );

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-blue-dark-sky to-blue-duck-egg backdrop-blur-lg -z-[1]" />
      <div className="fixed top-0 left-0 w-full h-full bg-white/80 dark:bg-black/90 backdrop-blur-lg -z-[1]" />
      <div className="container mx-auto px-2 pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
        <SetupExternalHeader />
        <div className="grid grid-cols-2 gap-4">
          {options.map(({ title, description, buttonText, onClick, disabled }, i) => (
            <LoginRequired key={title}>
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                className="bg-white rounded-2xl p-6 flex flex-col justify-between gap-4 cursor-pointer border border-transparent hover:border-blue-dark-sky"
                onClick={onClick}
              >
                <div className="text-xl font-bold">{title}</div>
                <div className="text-gray-600 dark:text-gray-400">{description}</div>

                <Button disabled={disabled} size="lg" icon={!disabled && <UilArrowRight />}>
                  {buttonText}
                </Button>
              </motion.div>
            </LoginRequired>
          ))}
          {step === "create" && <SetupExternalCreate onBack={() => setStep("intro")} />}
          {step === "import" && <SetupExternalImport />}
        </div>
      </div>
    </>
  );
}
