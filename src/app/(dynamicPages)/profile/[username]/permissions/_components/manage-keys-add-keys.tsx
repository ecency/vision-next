import { formatError } from "@/api/operations";
import { useClientActiveUser } from "@/api/queries";
import { error, success } from "@/features/shared";
import { FormControl, InputGroup } from "@/features/ui";
import { WalletSeedPhrase } from "@/features/wallet";
import { useAccountUpdateKeyAuths } from "@ecency/sdk";
import { useHiveKeysQuery } from "@ecency/wallets";
import { cryptoUtils, PrivateKey } from "@hiveio/dhive";
import { UilLock } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";

interface Props {
  onSuccess: () => void;
}

export function ManageKeysAddKeys({ onSuccess }: Props) {
  const activeUser = useClientActiveUser();

  const [currentPassword, setCurrentPassword] = useState("");

  const { data: keys } = useHiveKeysQuery(activeUser?.username!);

  const { mutateAsync: saveKeys } = useAccountUpdateKeyAuths(activeUser?.username!, {
    onSuccess: () => {
      onSuccess?.();
      success(i18next.t("permissions.keys.key-created"));
    },
    onError: (err) => {
      error(...formatError(err));
    }
  });

  return (
    <div>
      <div className="text-sm opacity-75 mb-4">{i18next.t("password-update.hint")}</div>
      <div>
        <label className="text-sm px-2">{i18next.t("password-update.cur-pass")}</label>
        <InputGroup prepend={<UilLock />}>
          <FormControl
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
            autoFocus={true}
            autoComplete="off"
          />
        </InputGroup>
      </div>

      <WalletSeedPhrase
        size="sm"
        showTitle={false}
        username={activeUser?.username!}
        onValidated={() =>
          keys &&
          saveKeys({
            keepCurrent: true,
            currentKey: cryptoUtils.isWif(currentPassword)
              ? PrivateKey.fromString(currentPassword)
              : PrivateKey.fromLogin(activeUser?.username!, currentPassword, "owner"),
            keys: [
              {
                owner: PrivateKey.fromString(keys.owner),
                active: PrivateKey.fromString(keys.active),
                posting: PrivateKey.fromString(keys.posting),
                memo_key: PrivateKey.fromString(keys.memo)
              }
            ]
          })
        }
      />
    </div>
  );
}
