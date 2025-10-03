import { useClientActiveUser } from "@/api/queries";
import { InputGroupCopyClipboard } from "@/features/ui";
import i18next from "i18next";
import Image from "next/image";

export function ReferralInfo() {
  const activeUser = useClientActiveUser();
  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-4">
      <Image src="/assets/undraw-referral.svg" width={200} height={200} alt="" />
      <div className="flex flex-col items-start gap-2">
        <h3 className="text-xl">{i18next.t("preferences.referral-link")}</h3>
        <div className="opacity-75">{i18next.t("preferences.referral-link-hint")}</div>
        <InputGroupCopyClipboard
          className="mb-3"
          value={`https://ecency.com/signup?referral=${activeUser?.username}`}
        />
      </div>
    </div>
  );
}
