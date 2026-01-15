import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button } from "@/features/ui";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";

export function PermissionsCard() {
  const { activeUser } = useActiveAccount();

  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-4">
      <Image src="/assets/undraw-access-denied.svg" width={200} height={200} alt="" />
      <div className="flex flex-col items-start gap-2">
        <h3 className="text-xl">{i18next.t("preferences.permissions-title")}</h3>
        <div className="opacity-75">{i18next.t("preferences.permissions-hint")}</div>
        <Link href={`/@${activeUser?.username}/permissions`}>
          <Button>{i18next.t("preferences.permissions")}</Button>
        </Link>
      </div>
    </div>
  );
}
