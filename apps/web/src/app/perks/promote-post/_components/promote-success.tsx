import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { UilCheckCircle } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";

export function PromoteSuccess() {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="px-2 py-4 sm:px-4 md:p-6 lg:p-12 flex flex-col gap-4 md:gap-8 lg:gap-12 xl:gap-16 items-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <UilCheckCircle className="text-green w-12 h-12" />
          <div className="text-xl font-bold">{i18next.t("trx-common.success-title")}</div>
          <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
            {i18next.t("trx-common.success-sub-title")}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/perks">
            <Button appearance="gray" size="sm">
              {i18next.t("perks.go-to-perks")}
            </Button>
          </Link>
          <Link href={`/@${activeUser?.username}/posts`}>
            <Button size="sm">{i18next.t("publish.go-to-posts")}</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
