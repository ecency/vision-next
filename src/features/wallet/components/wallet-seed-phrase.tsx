import { success } from "@/features/shared";
import { Button } from "@/features/ui";
import { useSeedPhrase } from "@ecency/wallets";
import { UilArrowRight, UilCopyAlt, UilSync } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useState } from "react";
import { useCopyToClipboard } from "react-use";
import { useDownloadSeed } from "../hooks";

const EXAMPLE_SEED = [
  "nice",
  "best",
  "fall",
  "hollow",
  "glass",
  "fix",
  "lesson",
  "topic",
  "wet",
  "sing",
  "fox",
  "rough"
];

interface Props {
  username: string;
  onValidated: () => void;
  showTitle?: boolean;
}

export function WalletSeedPhrase({ username, onValidated, showTitle = true }: Props) {
  const [hasRevealed, setHasRevealed] = useState(false);

  const { data: seed, refetch } = useSeedPhrase(username);

  const [_, copy] = useCopyToClipboard();
  const downloadSeed = useDownloadSeed(username);

  return (
    <div className="flex flex-col gap-4 w-full">
      {showTitle && (
        <div>
          <div className="text-lg font-semibold">{i18next.t("signup-wallets.seed.title")}</div>
          <div className="opacity-50">{i18next.t("signup-wallets.seed.description")}</div>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <Button icon={<UilCopyAlt />} appearance="gray-link" size="sm" />
        <Button
          icon={<UilSync />}
          appearance="gray-link"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            refetch();
          }}
        />
      </div>
      <div
        className="relative border border-[--border-color] p-4 grid grid-cols-3 xl:grid-cols-4 gap-4  rounded-xl cursor-pointer"
        onClick={() => {
          if (hasRevealed) {
            copy(seed!);
            success(i18next.t("signup-wallets.seed.copied"));
          } else {
            setHasRevealed(true);
          }
        }}
      >
        <AnimatePresence>
          {!hasRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute z-10 top-0 left-0 flex items-center justify-center h-full w-full font-bold"
            >
              {i18next.t("signup-wallets.seed.reveal")}
            </motion.div>
          )}
        </AnimatePresence>
        {(hasRevealed ? seed?.split(" ") ?? [] : EXAMPLE_SEED).map(
          (word: string, index: number) => (
            <div
              className={clsx(
                "duration-300 font-mono bg-gray-200 p-2 rounded-xl dark:bg-dark-default text-xl",
                hasRevealed ? "blur-none" : "blur-sm"
              )}
              key={index}
            >
              <span className="opacity-50">{index + 1}.</span> {word}
            </div>
          )
        )}
      </div>
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {i18next.t("signup-wallets.seed.hint")}
      </div>

      <div className="flex mt-4 justify-end">
        <Button
          icon={<UilArrowRight />}
          size="sm"
          onClick={() => {
            downloadSeed();
            onValidated();
          }}
        >
          {i18next.t("signup-wallets.seed.continue")}
        </Button>
      </div>
    </div>
  );
}
