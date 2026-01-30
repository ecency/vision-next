import { KeyInput, KeyInputImperativeHandle } from "@/features/ui";
import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useRef, useState } from "react";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import {
  deriveHiveKeys,
  deriveHiveMasterPasswordKeys,
  detectHiveKeyDerivation
} from "@ecency/wallets";
import { useKeyDerivationStore } from "../../_hooks";
import { error } from "@/features/shared";

interface Props {
  username: string;
  onNext: (ownerKey: string, originalCredential: string) => void;
}

export function Step1Authenticate({ username, onNext }: Props) {
  const keyInputRef = useRef<KeyInputImperativeHandle>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const setMultipleDerivations = useKeyDerivationStore((state) => state.setMultipleDerivations);

  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));

  const handleNext = async () => {
    if (!accountData) {
      error(i18next.t("permissions.add-keys.step1.error-account-not-loaded"));
      return;
    }

    setIsDetecting(true);
    try {
      // KeyInput already handles derivation and returns both derived key and raw credential
      const { privateKey, raw: credential } = await keyInputRef.current!.handleSign();

      // The privateKey is already the owner key (KeyInput derives it)
      const ownerKey = privateKey.toString();

      // Now detect what type of credential was provided for marking existing keys
      const detectedMethod = await detectHiveKeyDerivation(username, credential, "owner");
      let derivedKeys: any = null;

      // Derive all keys from the credential to mark matching ones
      if (detectedMethod === "bip44") {
        derivedKeys = deriveHiveKeys(credential);
      } else if (detectedMethod === "master-password") {
        derivedKeys = deriveHiveMasterPasswordKeys(username, credential);
      } else {
        // If it's a WIF key, we can't derive other keys, so skip marking
        derivedKeys = null;
      }

      // Mark existing keys that match this credential
      if (derivedKeys && accountData) {
        const derivationMap: Record<string, "bip44" | "master-password"> = {};

        // Check each key type
        const checkKey = (pubkey: string) => {
          if (pubkey === derivedKeys.ownerPubkey) derivationMap[pubkey] = detectedMethod;
          if (pubkey === derivedKeys.activePubkey) derivationMap[pubkey] = detectedMethod;
          if (pubkey === derivedKeys.postingPubkey) derivationMap[pubkey] = detectedMethod;
          if (pubkey === derivedKeys.memoPubkey) derivationMap[pubkey] = detectedMethod;
        };

        accountData.owner.key_auths.forEach(([key]) => checkKey(key.toString()));
        accountData.active.key_auths.forEach(([key]) => checkKey(key.toString()));
        accountData.posting.key_auths.forEach(([key]) => checkKey(key.toString()));
        checkKey(accountData.memo_key);

        if (Object.keys(derivationMap).length > 0) {
          setMultipleDerivations(username, derivationMap);
        }
      }

      onNext(ownerKey, credential);
    } catch (e) {
      error(i18next.t("permissions.add-keys.step1.error-authentication"));
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          {i18next.t("permissions.add-keys.step1.title")}
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>{i18next.t("permissions.add-keys.step1.info1")}</li>
          <li>{i18next.t("permissions.add-keys.step1.info2")}</li>
          <li>{i18next.t("permissions.add-keys.step1.info3")}</li>
        </ul>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">
          {i18next.t("permissions.add-keys.step1.authenticate")}
        </div>
        <div className="text-sm opacity-75 mb-4">{i18next.t("password-update.hint")}</div>
        <KeyInput ref={keyInputRef} keyType="owner" />
      </div>

      <div className="flex justify-end mt-4">
        <Button icon={<UilArrowRight />} onClick={handleNext} disabled={isDetecting}>
          {isDetecting ? i18next.t("g.validating") : i18next.t("g.next")}
        </Button>
      </div>
    </div>
  );
}
