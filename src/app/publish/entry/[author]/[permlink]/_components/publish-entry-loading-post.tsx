import { useGlobalStore } from "@/core/global-store";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import { useRouter } from "next/navigation";

export function PublishEntryLoadingPost() {
  const router = useRouter();

  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="container mx-auto max-w-[800px] py-4 sm:py-6 md:py-8 lg:py-10 xl:py-16"
    >
      <div className="px-2 py-4 sm:px-4 md:p-6 lg:p-12 bg-white rounded-2xl flex flex-col gap-4 md:gap-8 lg:gap-12 xl:gap-16 items-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <UilSpinner className="text-blue-dark-sky animate-spin w-12 h-12" />
          <div className="text-xl font-bold">{i18next.t("publish.loading-post-title")}</div>
          <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
            {i18next.t("publish.loading-post-hint")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
