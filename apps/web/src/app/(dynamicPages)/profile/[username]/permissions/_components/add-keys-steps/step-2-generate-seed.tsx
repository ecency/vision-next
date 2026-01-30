import { WalletSeedPhrase } from "@/features/wallet";
import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

interface Props {
  username: string;
  onNext: () => void;
  onBack: () => void;
}

export function Step2GenerateSeed({ username, onNext, onBack }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          {i18next.t("permissions.add-keys.step2.warning-title")}
        </h3>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
          <li>{i18next.t("permissions.add-keys.step2.warning1")}</li>
          <li>{i18next.t("permissions.add-keys.step2.warning2")}</li>
          <li>{i18next.t("permissions.add-keys.step2.warning3")}</li>
        </ul>
      </div>

      <WalletSeedPhrase
        size="sm"
        showTitle={true}
        showRefreshButton={false}
        username={username}
        onValidated={onNext}
      />

      <div className="flex justify-between mt-4">
        <Button appearance="gray-link" icon={<UilArrowLeft />} onClick={onBack}>
          {i18next.t("g.back")}
        </Button>
      </div>
    </div>
  );
}
