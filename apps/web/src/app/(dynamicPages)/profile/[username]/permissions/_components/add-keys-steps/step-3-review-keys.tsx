import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button, StyledTooltip } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";
import { useKeyDerivationStore } from "../../_hooks";

type Keys = Record<string, [string, number][]>;

interface Props {
  onNext: (keysToRevoke: string[]) => void;
  onBack: () => void;
}

export function Step3ReviewKeys({ onNext, onBack }: Props) {
  const { activeUser } = useActiveAccount();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const getDerivation = useKeyDerivationStore((state) => state.getDerivation);

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(activeUser?.username!),
    select: (resp) =>
      ({
        posting: resp.posting.key_auths,
        owner: resp.owner.key_auths,
        active: resp.active.key_auths,
        memo: [[resp.memo_key, 1]]
      }) as Keys
  });

  const toggleKey = (publicKey: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(publicKey)) {
        next.delete(publicKey);
      } else {
        next.add(publicKey);
      }
      return next;
    });
  };

  const getDerivationBadge = (publicKey: string) => {
    const method = getDerivation(activeUser?.username ?? "", publicKey);
    if (method === "unknown") {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          Unknown
        </span>
      );
    }

    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          method === "bip44"
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
        }`}
      >
        {method === "bip44" ? "BIP44 Seed" : "Master Password"}
      </span>
    );
  };

  const renderKeyType = (keyName: string) => {
    const keys = accountData?.[keyName] ?? [];
    if (keys.length === 0) return null;

    const isMemo = keyName === "memo";
    const canRevoke = !isMemo && keys.length > 1;

    return (
      <div key={keyName} className="mb-4">
        <div className="text-xs opacity-50 uppercase mb-2">
          {i18next.t(`manage-authorities.${keyName}`)}
          {isMemo && (
            <span className="ml-2 text-xs normal-case opacity-75">
              ({i18next.t("permissions.add-keys.step3.will-be-replaced")})
            </span>
          )}
        </div>
        {keys.map((key) => (
          <div
            key={key[0]}
            className="bg-gray-100 dark:bg-dark-200 border border-[--border-color] rounded-lg p-3 mb-2"
          >
            <div className="flex items-start gap-3">
              {!isMemo && (
                <input
                  type="checkbox"
                  checked={selectedKeys.has(key[0])}
                  onChange={() => toggleKey(key[0])}
                  className="mt-1"
                  disabled={!canRevoke}
                />
              )}
              {isMemo && <div className="w-4" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">{getDerivationBadge(key[0])}</div>
                <StyledTooltip content={i18next.t("chat.public-key")}>
                  <div className="font-mono text-xs truncate opacity-75">{key[0]}</div>
                </StyledTooltip>
                {!canRevoke && !isMemo && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {i18next.t("permissions.add-keys.step3.cannot-revoke-last")}
                  </div>
                )}
                {isMemo && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {i18next.t("permissions.add-keys.step3.memo-will-replace")}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          {i18next.t("permissions.add-keys.step3.title")}
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {i18next.t("permissions.add-keys.step3.description")}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {renderKeyType("owner")}
        {renderKeyType("active")}
        {renderKeyType("posting")}
        {renderKeyType("memo")}
      </div>

      {selectedKeys.size > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
          {i18next.t("permissions.add-keys.step3.selected-count", { count: selectedKeys.size })}
        </div>
      )}

      <div className="flex justify-between mt-4">
        <Button appearance="gray-link" icon={<UilArrowLeft />} onClick={onBack}>
          {i18next.t("g.back")}
        </Button>
        <Button icon={<UilArrowRight />} onClick={() => onNext(Array.from(selectedKeys))}>
          {selectedKeys.size > 0
            ? i18next.t("permissions.add-keys.step3.next-with-revoke")
            : i18next.t("permissions.add-keys.step3.next-skip")}
        </Button>
      </div>
    </div>
  );
}
