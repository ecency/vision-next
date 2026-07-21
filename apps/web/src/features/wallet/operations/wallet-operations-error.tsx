import { UilTimesCircle } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

interface Props {
  error?: Error;
}

export function WalletOperationError({ error }: Props) {
  return (
    <div className="animate-scale-in origin-top border-t border-[--border-color] mx-auto max-w-[800px] overflow-hidden">
      <div className="p-4 flex items-center justify-center gap-2">
        <UilTimesCircle className="text-red size-10" />
        <div>
          <div className="font-bold">{i18next.t("g.error")}</div>
          <div className="opacity-50 text-sm">{error?.message}</div>
        </div>
      </div>
    </div>
  );
}
