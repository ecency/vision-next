import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { UilCheckCircle, UilClock } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";

interface Props {
  step: "published" | "scheduled";
  setEditStep: () => void;
}

export function PublishSuccessState({ step, setEditStep }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const profileHref = activeUser ? `/@${activeUser.username}/posts` : "/";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="container mx-auto max-w-[800px] py-4 sm:py-6 md:py-8 lg:py-10 xl:py-16"
    >
      <div className="px-2 py-4 sm:px-4 md:p-6 lg:p-12 bg-white rounded-2xl flex flex-col gap-4 md:gap-8 lg:gap-12 xl:gap-16 items-center">
        <div className="flex flex-col items-center justify-center gap-2">
          {step === "published" && <UilCheckCircle className="text-green w-12 h-12" />}
          {step === "scheduled" && <UilClock className="text-blue-dark-sky w-12 h-12" />}
          <div className="text-xl font-bold">
            {step === "published" && i18next.t("publish.published-title")}
            {step === "scheduled" && i18next.t("publish.scheduled-title")}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
            {step === "published" && i18next.t("publish.published-hint")}
            {step === "scheduled" && i18next.t("publish.scheduled-hint")}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/publish">
            <Button appearance="gray" size="sm" onClick={() => setEditStep()}>
              {i18next.t("publish.back-to-editor")}
            </Button>
          </Link>
          <Link href={profileHref}>
            <Button size="sm">{i18next.t("publish.go-to-posts")}</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
