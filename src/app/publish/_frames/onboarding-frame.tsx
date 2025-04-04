import { UilArrow, UilBold, UilItalic, UilTextStrikeThrough } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useCallback, useEffect, useMemo } from "react";

interface Props {
  step: string;
}

export function OnboardingFrame({ step }: Props) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    handleAnimation();
  }, [step]);

  const handleAnimation = useCallback(async () => {
    switch (step) {
      case "single-view":
        await animate("#onboarding-frame-page", {
          opacity: 1,
          scale: 1,
          width: 300,
          height: 400
        });
        await animate("#onboarding-frame-toolbar", {
          y: 0,
          height: 32
        });
        break;
      case "toolbar":
        await animate("#onboarding-frame-page", {
          width: "100%",
          opacity: 1,
          scale: 1,
          height: 200
        });
        await animate("#onboarding-frame-toolbar", {
          y: 0,
          height: 64
        });
        break;
      default:
        null;
    }
  }, [step]);

  return (
    <div ref={scope}>
      <motion.div
        id="onboarding-frame-page"
        initial={{
          opacity: 0,
          scale: 0.9
        }}
        className={clsx(
          "bg-gray-200 mx-auto dark:bg-dark-default overflow-hidden",
          step === "toolbar" ? "rounded-t-xl" : "rounded-xl"
        )}
      >
        <motion.div
          id="onboarding-frame-toolbar"
          initial={{
            y: -32
          }}
          className="bg-gray-300 dark:bg-gray-700 flex items-center gap-4 px-4"
        >
          <AnimatePresence>
            {step === "toolbar" && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.3
                  }}
                >
                  <UilBold />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.6
                  }}
                >
                  <UilItalic />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.9
                  }}
                >
                  <UilTextStrikeThrough />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 1.2
                  }}
                >
                  <UilArrow />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div className="p-4 flex flex-col justify-start gap-2">
          <motion.div
            initial={{
              width: 0
            }}
            animate={{ width: "80%" }}
            transition={{ delay: 0.6 }}
            className="bg-white min-h-[24px] rounded-lg"
          />
          <motion.div
            initial={{
              width: 0
            }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.9 }}
            className="bg-white min-h-[16px] rounded-lg"
          />
          <motion.div
            initial={{
              width: 0
            }}
            animate={{ width: "40%" }}
            transition={{ delay: 1.2 }}
            className="bg-white min-h-[16px] rounded-lg"
          />
          <motion.div
            initial={{
              height: 0
            }}
            animate={{ height: 128 }}
            transition={{ delay: 1.5 }}
            className="bg-white my-2 w-full rounded-lg"
          />
          <motion.div
            initial={{
              width: 0
            }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.8 }}
            className="bg-white min-h-[16px] rounded-lg"
          />
          <motion.div
            initial={{
              width: 0
            }}
            animate={{ width: "100%" }}
            transition={{ delay: 2.1 }}
            className="bg-white min-h-[16px] rounded-lg"
          />
          <motion.div
            initial={{
              width: 0
            }}
            animate={{ width: "20%" }}
            transition={{ delay: 2.4 }}
            className="bg-white min-h-[16px] rounded-lg"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
