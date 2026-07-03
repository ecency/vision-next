import { UilCheckCircle } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useTimeoutFn } from "react-use";

interface Props {
  onClose: () => void;
}

export function WalletOperationSuccess({ onClose }: Props) {
  useTimeoutFn(onClose, 5000);

  return (
    <div className="animate-scale-in origin-top border-t border-[--border-color] mx-auto max-w-[800px] overflow-hidden">
      <div className="p-4 flex items-center justify-center gap-2">
        <UilCheckCircle className="text-green w-10 h-10" />
        <div>
          <div className="font-bold">{i18next.t("g.success")}</div>
          <div className="opacity-50 text-sm">{i18next.t("transactions.success-close-hint")}</div>
        </div>
      </div>
    </div>
  );
}
