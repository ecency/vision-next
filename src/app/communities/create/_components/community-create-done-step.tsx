import i18next from "i18next";
import { CommunityCreateCardLayout } from "./community-create-card-layout";
import { UilCheckCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@/features/ui";
import Link from "next/link";

interface Props {
  username: string;
}

export function CommunityCreateDoneStep({ username }: Props) {
  return (
    <CommunityCreateCardLayout hideTitle={true}>
      <div className="md:py-16 flex flex-col gap-4 md:gap-8">
        <div className="flex flex-col items-center justify-center gap-2">
          <UilCheckCircle className="text-green w-12 h-12" />
          <div className="text-xl font-bold">{i18next.t("communities-create.done")}</div>
          <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
            {i18next.t("communities-create.done-hint")}
          </div>
        </div>

        <div className="flex justify-center items-center gap-4">
          <Link href="/communities">
            <Button appearance="gray" size="sm">
              {i18next.t("communities-create.back-to-communities")}
            </Button>
          </Link>
          <Link href={`/created/${username}`}>
            <Button size="sm">{i18next.t("communities-create.open-community")}</Button>
          </Link>
        </div>
      </div>
    </CommunityCreateCardLayout>
  );
}
