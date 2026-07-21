import { UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

export function WalletOperationSigning() {
  return (
    <div className="animate-scale-in origin-top border-t border-[--border-color] mx-auto max-w-[800px] overflow-hidden">
      <div className="p-4 flex items-center justify-center gap-2">
        <UilSpinner className="text-blue-dark-sky animate-spin size-10" />
        <div className="font-bold">{i18next.t("market.signing")}</div>
      </div>
    </div>
  );
}
