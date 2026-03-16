import { Button } from "@/features/ui";
import { useDownloadKeys } from "@/features/wallet";
import { generateMasterPassword } from "@/utils/master-password";
import { UilArrowLeft, UilArrowRight, UilCopyAlt, UilSync } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useState } from "react";
import { success } from "@/features/shared";
import { useCopyToClipboard } from "react-use";

interface Props {
  username: string;
  onNext: (masterPassword: string) => void;
  onBack?: () => void;
}

export function Step2GenerateSeed({ username, onNext, onBack }: Props) {
  const [masterPassword, setMasterPassword] = useState(() => generateMasterPassword());
  const [_, copy] = useCopyToClipboard();
  const downloadKeys = useDownloadKeys(masterPassword, username);

  const handleRegenerate = useCallback(() => {
    setMasterPassword(generateMasterPassword());
  }, []);

  const handleCopy = useCallback(() => {
    copy(masterPassword);
    success(i18next.t("onboard.copy-password"));
  }, [masterPassword, copy]);

  const handleContinue = useCallback(() => {
    downloadKeys();
    onNext(masterPassword);
  }, [downloadKeys, onNext, masterPassword]);

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

      <div>
        <div className="text-lg font-semibold">
          {i18next.t("permissions.add-keys.step2.master-password-title", {
            defaultValue: "Your new master password"
          })}
        </div>
        <div className="opacity-50 text-sm mt-1">
          {i18next.t("permissions.add-keys.step2.master-password-description", {
            defaultValue: "Save this master password securely. It derives all your account keys."
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button icon={<UilCopyAlt />} appearance="gray-link" size="sm" onClick={handleCopy} />
        <Button icon={<UilSync />} appearance="gray-link" size="sm" onClick={handleRegenerate} />
      </div>

      <div className="border border-[--border-color] p-4 rounded-xl">
        <span className="font-mono text-sm break-all">{masterPassword}</span>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {i18next.t("permissions.add-keys.step2.master-password-hint", {
          defaultValue: "Clicking continue will download a file with your master password and all derived keys."
        })}
      </div>

      <div className={`flex mt-4 ${onBack ? "justify-between" : "justify-end"}`}>
        {onBack && (
          <Button appearance="gray-link" icon={<UilArrowLeft />} onClick={onBack}>
            {i18next.t("g.back")}
          </Button>
        )}
        <Button icon={<UilArrowRight />} size="sm" onClick={handleContinue}>
          {i18next.t("g.continue")}
        </Button>
      </div>
    </div>
  );
}
