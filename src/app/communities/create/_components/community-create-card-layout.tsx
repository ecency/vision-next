import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { PropsWithChildren } from "react";

export function CommunityCreateCardLayout({
  children,
  hideTitle = false
}: PropsWithChildren<{ hideTitle?: boolean }>) {
  return (
    <div className="md:col-span-2 p-2 md:p-4 lg:p-6 bg-white rounded-xl w-full flex flex-col gap-4">
      {!hideTitle && (
        <div>
          <Link href="/communities">
            <Button
              size="sm"
              appearance="gray-link"
              icon={<UilArrowLeft />}
              iconPlacement="left"
              noPadding={true}
            >
              {i18next.t("g.back")}
            </Button>
          </Link>
          <h1 className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
            {i18next.t("communities-create.page-title")}
          </h1>
          <h2 className="opacity-50 mb-4">
            {i18next.t("communities-create.reason-one")}.{" "}
            {i18next.t("communities-create.reason-two")}.{" "}
            {i18next.t("communities-create.reason-three")}
          </h2>
        </div>
      )}
      {children}
    </div>
  );
}
