import { formatError } from "@/api/format-error";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { useAccountUpdateKeyAuths, getAccountFullQueryOptions } from "@ecency/sdk";
import { useHiveKeysQuery } from "@ecency/wallets";
import { PrivateKey } from "@hiveio/dhive";
import { UilArrowLeft, UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useEffect, useRef, useState } from "react";
import { useKeyDerivationStore } from "../../_hooks";
import { useQueryClient } from "@tanstack/react-query";

type KeyAuthority = "owner" | "active" | "posting" | "memo";

interface Props {
  ownerKey: string;
  keysToRevokeByAuthority: Record<KeyAuthority, string[]>;
  onBack: () => void;
  onSuccess: () => void;
}

export function Step4Confirm({ ownerKey, keysToRevokeByAuthority, onBack, onSuccess }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  if (!username) {
    throw new Error("Cannot confirm key update without an active user");
  }

  const { data: keys } = useHiveKeysQuery(username);
  const setMultipleDerivations = useKeyDerivationStore((state) => state.setMultipleDerivations);
  const [isApplying, setIsApplying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const hasSubmittedRef = useRef(false);
  const queryClient = useQueryClient();

  const { mutateAsync: saveKeys } = useAccountUpdateKeyAuths(username, {
    onSuccess: async () => {
      // Store derivation info for the newly added BIP44 keys
      if (keys) {
        setMultipleDerivations(username, {
          [keys.ownerPubkey]: "bip44",
          [keys.activePubkey]: "bip44",
          [keys.postingPubkey]: "bip44",
          [keys.memoPubkey]: "bip44"
        });
      }

      // Invalidate account query to refresh permissions page
      await queryClient.invalidateQueries({
        queryKey: getAccountFullQueryOptions(username).queryKey
      });

      setIsComplete(true);
      success(i18next.t("permissions.keys.key-created"));
      setTimeout(() => onSuccess(), 1500);
    },
    onError: (err) => {
      setIsApplying(false);
      error(...formatError(err));
    }
  });

  const handleConfirm = async () => {
    if (!keys) {
      error(i18next.t("permissions.add-keys.step4.error-no-keys"));
      return;
    }

    if (hasSubmittedRef.current || isApplying) {
      return; // Prevent double submission
    }

    hasSubmittedRef.current = true;
    setIsApplying(true);

    try {
      await saveKeys({
        keepCurrent: true, // Always keep current keys, keysToRevokeByAuthority handles removal
        currentKey: PrivateKey.fromString(ownerKey),
        keysToRevokeByAuthority,
        keys: [
          {
            owner: PrivateKey.fromString(keys.owner),
            active: PrivateKey.fromString(keys.active),
            posting: PrivateKey.fromString(keys.posting),
            memo_key: PrivateKey.fromString(keys.memo)
          }
        ]
      });
    } catch (err) {
      // Error handled in onError callback
    }
  };

  useEffect(() => {
    // Auto-apply once keys are available and not already applying
    if (!keys || isApplying || hasSubmittedRef.current) {
      return;
    }
    handleConfirm();
  }, [keys, isApplying]);

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <UilCheckCircle className="w-16 h-16 text-green-500" />
        <h3 className="text-xl font-semibold">{i18next.t("permissions.add-keys.step4.success")}</h3>
        <p className="text-sm opacity-75 text-center">
          {i18next.t("permissions.add-keys.step4.success-description")}
        </p>
      </div>
    );
  }

  if (isApplying) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <UilSpinner className="w-16 h-16 animate-spin opacity-50" />
        <h3 className="text-xl font-semibold">{i18next.t("permissions.add-keys.step4.applying")}</h3>
        <p className="text-sm opacity-75">{i18next.t("permissions.add-keys.step4.please-wait")}</p>
      </div>
    );
  }

  const getTotalRevocationCount = () => {
    return Object.values(keysToRevokeByAuthority).reduce(
      (total, keys) => total + keys.length,
      0
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
          {i18next.t("permissions.add-keys.step4.title")}
        </h3>
        <p className="text-sm text-green-800 dark:text-green-200">
          {i18next.t("permissions.add-keys.step4.description")}
        </p>
      </div>

      <div className="bg-white dark:bg-dark-200 border border-[--border-color] rounded-lg p-4">
        <div className="space-y-3">
          <div>
            <div className="text-xs opacity-50 uppercase mb-1">
              {i18next.t("permissions.add-keys.step4.adding")}
            </div>
            <div className="text-sm">
              {i18next.t("permissions.add-keys.step4.new-bip44-keys")}
            </div>
          </div>

          {getTotalRevocationCount() > 0 && (
            <div>
              <div className="text-xs opacity-50 uppercase mb-1">
                {i18next.t("permissions.add-keys.step4.revoking")}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                {i18next.t("permissions.add-keys.step4.revoking-count", {
                  count: getTotalRevocationCount()
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button appearance="gray-link" icon={<UilArrowLeft />} onClick={onBack}>
          {i18next.t("g.back")}
        </Button>
        <Button onClick={handleConfirm}>{i18next.t("g.confirm")}</Button>
      </div>
    </div>
  );
}
