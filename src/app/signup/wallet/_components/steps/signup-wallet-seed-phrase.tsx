import { success } from "@/features/shared";
import { Alert, Button } from "@/features/ui";
import { useSeedPhrase } from "@ecency/wallets";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useCopyToClipboard } from "react-use";
import { useDownloadSeed } from "../../_hooks";

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
}

export function SignupWalletSeedPhrase({ username }: Props) {
  const [hasRevealed, setHasRevealed] = useState(false);

  const { data: seed } = useSeedPhrase();

  const [_, copy] = useCopyToClipboard();
  const downloadSeed = useDownloadSeed(username);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">Seed phrase</div>
        <div className="opacity-50">
          This seed phrase is a master key to all wallets and Hive account
        </div>
      </div>
      <div
        className="relative border border-[--border-color] p-4 grid grid-cols-4 gap-4 mt-4 rounded-xl cursor-pointer"
        onClick={() => {
          if (hasRevealed) {
            copy(seed);
            success("Seed phrase has copied");
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
              className="absolute top-0 left-0 flex items-center justify-center h-full w-full font-bold"
            >
              Tap/Click to reveal phrase
            </motion.div>
          )}
        </AnimatePresence>
        {(hasRevealed ? seed?.split(" ") ?? [] : EXAMPLE_SEED).map(
          (word: string, index: number) => (
            <div
              className={clsx("duration-300 text-xl", hasRevealed ? "blur-none" : "blur-sm")}
              key={word}
            >
              <span className="opacity-50">{index + 1}.</span> {word}
            </div>
          )
        )}
      </div>
      {hasRevealed && (
        <div className="flex items-center justify-center">
          <Button size="lg" appearance="secondary" onClick={downloadSeed}>
            Download seed as file
          </Button>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        By clicking Continue, you acknowledge that the seed phrase will be displayed only once and
        cannot be recovered if lost or forgotten.
      </div>
    </div>
  );
}
