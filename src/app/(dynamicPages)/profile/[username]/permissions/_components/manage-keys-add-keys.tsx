import { formatError } from "@/api/operations";
import { useClientActiveUser } from "@/api/queries";
import { error, success } from "@/features/shared";
import { KeyInput, KeyInputImperativeHandle } from "@/features/ui";
import { WalletSeedPhrase } from "@/features/wallet";
import { useAccountUpdateKeyAuths } from "@ecency/sdk";
import { useHiveKeysQuery } from "@ecency/wallets";
import { PrivateKey } from "@hiveio/dhive";
import i18next from "i18next";
import { useCallback, useRef } from "react";

interface Props {
  onSuccess: () => void;
}

export function ManageKeysAddKeys({ onSuccess }: Props) {
  const keyInputRef = useRef<KeyInputImperativeHandle>(null);

  const activeUser = useClientActiveUser();

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

  const handleSaveKeys = useCallback(async () => {
    if (keys) {
      const { privateKey } = await keyInputRef.current!.handleSign();
      saveKeys({
        keepCurrent: true,
        currentKey: privateKey,
        keys: [
          {
            owner: PrivateKey.fromString(keys.owner),
            active: PrivateKey.fromString(keys.active),
            posting: PrivateKey.fromString(keys.posting),
            memo_key: PrivateKey.fromString(keys.memo)
          }
        ]
      });
    } else {
      throw new Error("[AddKeys] – no keys found");
    }
  }, [keys, saveKeys]);

  return (
    <div>
      <div className="text-sm opacity-75 mb-4">{i18next.t("password-update.hint")}</div>

      <KeyInput ref={keyInputRef} />

      <WalletSeedPhrase
        size="sm"
        showTitle={false}
        username={activeUser?.username!}
        onValidated={handleSaveKeys}
      />
    </div>
  );
}
