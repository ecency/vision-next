import { usePublishState } from "@/app/publish/_hooks";
import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { makeEntryPath } from "@/utils";
import { Entry } from "@/entities";
import { UilCheckCircle } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Props {
  entry?: Entry;
}

export function PublishEntrySuccessState({ entry }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { tags } = usePublishState();

  const params = useParams();

  const author = params?.author ?? "";
  const permlink = params?.permlink ?? "";

  const sanitizedAuthor = (author as string).replace("%40", "");
  const category = tags?.[0] ?? entry?.category;
  const entryHref =
    category && sanitizedAuthor && permlink
      ? makeEntryPath(category, sanitizedAuthor, permlink as string)
      : "#";
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
          <UilCheckCircle className="text-green w-12 h-12" />
          <div className="text-xl font-bold">{i18next.t("publish.updated-title")}</div>
          <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
            {i18next.t("publish.updated-hint")}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {entryHref !== "#" ? (
            <Link href={entryHref}>
              <Button appearance="gray" size="sm">
                {i18next.t("publish.back-to-post")}
              </Button>
            </Link>
          ) : (
            <Button appearance="gray" size="sm" disabled={true}>
              {i18next.t("publish.back-to-post")}
            </Button>
          )}
          <Link href={profileHref}>
            <Button size="sm">{i18next.t("publish.go-to-posts")}</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
