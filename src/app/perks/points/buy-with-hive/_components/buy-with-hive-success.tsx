import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { UilCheckCircle } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props {
  pointsAmount: string;
}

export function BuyWithHiveSuccess({ pointsAmount }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="container mx-auto max-w-[800px] py-4 sm:py-6 md:py-8"
    >
      <div className="px-2 py-4 sm:px-4 md:p-6 lg:p-12 bg-white rounded-2xl flex flex-col gap-4 md:gap-8 lg:gap-12 xl:gap-16 items-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <UilCheckCircle className="text-green w-12 h-12" />

          <div className="text-xl font-bold">You've got +{pointsAmount} points</div>
          <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
            Points has transferred to your account. Please, check it in a wallet page or perks
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/perks/points">
            <Button appearance="gray" size="sm">
              Spend points
            </Button>
          </Link>
          <Link href={`/@${activeUser?.username}/wallet`}>
            <Button size="sm">Go to wallet</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
