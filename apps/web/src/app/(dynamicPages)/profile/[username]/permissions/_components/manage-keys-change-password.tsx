import { useAccountChangePassword } from "@/api/mutations";
import { useClientActiveUser } from "@/api/queries";
import { error, success } from "@/features/shared";
import { Button, KeyInput, KeyInputImperativeHandle } from "@/features/ui";
import { WalletSeedPhrase } from "@/features/wallet";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useHiveKeysQuery } from "@ecency/wallets";
import { PrivateKey } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useCallback, useRef, useState } from "react";

export function ManageKeyChangePassword() {
  const activeUser = useClientActiveUser();

  const keyInputRef = useRef<KeyInputImperativeHandle>(null);

  const [showSeed, setShowSeed] = useState(false);
  const [currentKey, setCurrentKey] = useState<PrivateKey>();
  const [rawKey, setRawKey] = useState<string>();

  const { data: accountOwnerPublicKeys } = useQuery({
    ...getAccountFullQueryOptions(activeUser?.username!),
    select: (resp) => resp.owner.key_auths as [string, number][]
  });
  const { data: keys } = useHiveKeysQuery(activeUser?.username!);

  const { mutateAsync: changePassword } = useAccountChangePassword(activeUser?.username!);

  const handleGenerateNewPassword = useCallback(async () => {
    const { privateKey, raw } = await keyInputRef.current!.handleSign();
    const publicKey = privateKey.createPublic().toString();

    if (accountOwnerPublicKeys?.find(([key]) => key === publicKey)) {
      setCurrentKey(privateKey);
      setRawKey(raw);
      setShowSeed(true);
    } else {
      error(i18next.t("permissions.change-password.invalid-key"));
    }
  }, [accountOwnerPublicKeys]);

  const handleChangePassword = useCallback(async () => {
    if (keys && currentKey) {
      await changePassword({
        newKeys: {
          owner: PrivateKey.fromString(keys.owner),
          active: PrivateKey.fromString(keys.active),
          posting: PrivateKey.fromString(keys.posting),
          memo_key: PrivateKey.fromString(keys.memo)
        },
        currentPassword: rawKey!
      });

      setShowSeed(false);
      setCurrentKey(undefined);
      success(i18next.t("permissions.change-password.success"));
    }
  }, [keys, currentKey, activeUser, rawKey]);

  return (
    <div className="w-full pt-4">
      {!showSeed && (
        <div className="flex flex-col items-start gap-4 w-full">
          <KeyInput
            keyType="owner"
            placeholder="Current key"
            className="w-full"
            ref={keyInputRef}
          />
          <Button onClick={() => handleGenerateNewPassword()} size="sm">
            {i18next.t("permissions.change-password.generate")}
          </Button>
        </div>
      )}
      {showSeed && (
        <WalletSeedPhrase
          size="sm"
          showTitle={false}
          username={activeUser?.username!}
          onValidated={() => handleChangePassword()}
        />
      )}
    </div>
  );
}
