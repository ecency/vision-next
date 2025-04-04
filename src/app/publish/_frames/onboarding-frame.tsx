import {
  UilArrow,
  UilBold,
  UilCheckCircle,
  UilEllipsisV,
  UilImage,
  UilItalic,
  UilTextStrikeThrough
} from "@tooni/iconscout-unicons-react";
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
          height: 300
        });
        await animate("#onboarding-frame-action-bar", {
          opacity: 1,
          width: 300
        });
        await animate("#onboarding-frame-toolbar", {
          y: 0,
          height: 32
        });
        await animate("#onboarding-frame-community-picker", {
          opacity: 1,
          height: 16
        });
        await animate("#onboarding-frame-publish", {
          opacity: 1,
          height: 16
        });
        await animate("#onboarding-frame-settings", {
          opacity: 1,
          height: 16,
          width: 16
        });
        break;
      case "toolbar":
        await animate("#onboarding-frame-page", {
          width: "100%",
          opacity: 1,
          scale: 1,
          height: 100
        });
        await animate("#onboarding-frame-action-bar", {
          opacity: 1,
          width: "100%"
        });
        await animate("#onboarding-frame-toolbar", {
          y: 0,
          height: 64
        });
        break;
      case "settings":
        await animate("#onboarding-frame-toolbar", {
          opacity: 1,
          height: 32
        });
        await animate("#onboarding-frame-publish", {
          opacity: 1,
          height: 32,
          width: 100
        });
        await animate("#onboarding-frame-settings", {
          opacity: 1,
          width: 32,
          height: 32
        });
        break;
      case "posting":
        await animate("#onboarding-frame-page", {
          scale: 1,
          width: 300,
          height: 300,
          opacity: 0.5
        });
        await animate("#onboarding-frame-action-bar", {
          opacity: 0.5,
          width: 300
        });
        await animate("#onboarding-frame-toolbar", {
          y: 0,
          height: 32
        });
        await animate("#onboarding-frame-community-picker", {
          opacity: 1,
          height: 16
        });
        await animate("#onboarding-frame-publish", {
          opacity: 1,
          height: 16
        });
        await animate("#onboarding-frame-settings", {
          opacity: 1,
          height: 16,
          width: 16
        });

        await animate("#onboarding-frame-posting", {
          opacity: 1,
          scale: 1
        });
        break;
      default:
        null;
    }
  }, [step]);

  return (
    <div className="relative" ref={scope}>
      <div id="onboarding-frame-action-bar" className="flex mx-auto justify-between items-end pb-3">
        <motion.div
          id="onboarding-frame-community-picker"
          initial={{
            opacity: 0,
            height: 0
          }}
          className="bg-gray-200 w-[72px] dark:bg-dark-default rounded-xl"
        />
        <div className="flex gap-2">
          <motion.div
            id="onboarding-frame-publish"
            initial={{
              opacity: 0,
              height: 0
            }}
            className="bg-green w-[48px] rounded-xl text-white text-sm flex items-center justify-center"
          >
            {step === "settings" && "Publish"}
          </motion.div>
          <motion.div
            id="onboarding-frame-settings"
            initial={{
              opacity: 0,
              height: 0
            }}
            className="bg-gray-200 dark:bg-dark-default rounded-xl flex items-center justify-center"
          >
            {step === "settings" && <UilEllipsisV className="w-4 h-4" />}
          </motion.div>
        </div>
      </div>
      <motion.div
        id="onboarding-frame-page"
        initial={{
          opacity: 0,
          scale: 0.9
        }}
        className={clsx(
          "bg-gray-200 mx-auto dark:bg-dark-default overflow-hidden",
          step === "toolbar" || step === "settings" ? "rounded-t-xl" : "rounded-xl"
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

      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <motion.div
          id="onboarding-frame-posting"
          initial={{ opacity: 0, scale: 0.5 }}
          className={clsx(
            "min-w-full min-h-[200px] bg-gray-200 dark:bg-dark-default rounded-xl gap-4 p-4",
            step === "posting" && "grid grid-cols-2",
            step === "finish" && "flex flex-col items-center justify-center"
          )}
        >
          {step === "finish" && (
            <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}>
              <UilCheckCircle className="text-green w-16 h-16" />
            </motion.div>
          )}
          {step === "posting" && (
            <div className="flex flex-col gap-2">
              <motion.div
                initial={{
                  height: 0
                }}
                animate={{ height: 100 }}
                transition={{ delay: 0.3 }}
                className="bg-white w-full rounded-lg flex items-center justify-center"
              >
                {step === "posting" && <UilImage className="text-blue-dark-sky" />}
              </motion.div>
              <motion.div
                initial={{
                  width: 0,
                  height: 16
                }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg"
              />
              <motion.div
                initial={{
                  width: 0,
                  height: 24
                }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-lg"
              />
            </div>
          )}
          {step === "posting" && (
            <div className="flex flex-col gap-2">
              <motion.div
                initial={{
                  width: 0
                }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.6 }}
                className="bg-white min-h-[16px] rounded-lg"
              />
              <motion.div
                initial={{
                  width: 0,
                  height: 24
                }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-lg"
              />
              <motion.div
                initial={{
                  width: 0,
                  height: 16
                }}
                animate={{ width: 48 }}
                transition={{ delay: 1.2 }}
                className="bg-green rounded-lg"
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
