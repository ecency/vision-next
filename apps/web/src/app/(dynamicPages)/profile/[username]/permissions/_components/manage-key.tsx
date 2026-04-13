import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button, StyledTooltip } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilCopy, UilEye, UilTrash } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";
import { useCopyToClipboard } from "react-use";
import { ManageKeyPasswordDialog } from "./manage-key-password-dialog";
import { useRevealedKeysStore, useKeyDerivationStore } from "../_hooks";
import { getLoginType } from "@/utils/user-token";

type Keys = Record<string, [string, number][]>;

interface Props {
  keyName: string;
  onRevoke: (publicKey: string) => void;
}

export function ManageKey({ keyName, onRevoke }: Props) {
  const { activeUser } = useActiveAccount();

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(activeUser?.username ?? ""),
    enabled: !!activeUser?.username,
    select: (resp) =>
      ({
        posting: resp.posting.key_auths,
        owner: resp.owner.key_auths,
        active: resp.active.key_auths,
        weight: resp.active.weight_threshold,
        memo: [[resp.memo_key, 1]]
      }) as Keys
  });
  const keys = useRevealedKeysStore((state) => state[activeUser?.username ?? ""] ?? {});
  const getDerivation = useKeyDerivationStore((state) => state.getDerivation);

  const [_, copy] = useCopyToClipboard();

  const isMetamask = getLoginType(activeUser?.username ?? "") === "metamask";

  const [showReveal, setShowReveal] = useState(false);

  const loginType = getLoginType(activeUser?.username ?? "");

  const getLoginTypeBadge = () => {
    switch (loginType) {
      case "metamask":
        return { label: "MetaMask", className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" };
      case "keychain":
        return { label: "Keychain", className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" };
      case "hivesigner":
        return { label: "HiveSigner", className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" };
      default:
        return null;
    }
  };

  const getDerivationBadge = (publicKey: string) => {
    const method = getDerivation(activeUser?.username ?? "", publicKey);

    if (method === "unknown") {
      const badge = getLoginTypeBadge();
      if (!badge) return null;
      return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
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

  return (
    <>
      <div className="bg-gray-100 dark:bg-dark-200 border border-[--border-color] rounded-lg flex flex-col text-gray-900 dark:text-white">
        <div className="text-xs opacity-50 uppercase p-2">
          {i18next.t(`manage-authorities.${keyName}`)}
        </div>
        {accountData?.[keyName].map((key) => (
          <div
            className=" w-full p-2 border-b last:border-0 border-[--border-color] flex items-center justify-between"
            key={key[0]}
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2 mb-1">
                {getDerivationBadge(key[0])}
              </div>
              <StyledTooltip
                content={i18next.t("chat.public-key")}
                className="grid grid-cols-[1fr_max-content] items-center font-mono gap-2 truncate"
              >
                <div className="truncate">{key[0]}</div>
                <div className="flex gap-2">
                  <Button
                    noPadding={true}
                    appearance="gray-link"
                    size="sm"
                    icon={<UilCopy />}
                    aria-label={i18next.t("manage-authorities.copy")}
                    onClick={() => copy(key[0])}
                  />
                  {accountData?.[keyName].length > 1 && (
                    <StyledTooltip content={i18next.t("manage-authorities.revoke")}>
                      <Button
                        noPadding={true}
                        appearance="gray-link"
                        size="sm"
                        icon={<UilTrash />}
                        aria-label={i18next.t("manage-authorities.revoke")}
                        onClick={() => onRevoke(key[0])}
                      />
                    </StyledTooltip>
                  )}
                </div>
              </StyledTooltip>

              {!isMetamask && (
                <div className="grid grid-cols-[1fr_max-content] gap-2 items-center font-mono truncate">
                  <StyledTooltip className="truncate" content={i18next.t("chat.private-key")}>
                    {keys[key[0]]
                      ? keys[key[0]]
                      : "************************************************************************"}
                  </StyledTooltip>
                  <div className="flex gap-2">
                    {keys[key[0]] && (
                      <Button
                        noPadding={true}
                        appearance="gray-link"
                        size="sm"
                        icon={<UilCopy />}
                        onClick={() => copy(keys[key[0]])}
                      />
                    )}
                    {!keys[key[0]] && (
                      <StyledTooltip content={i18next.t("manage-authorities.reveal-private-key")}>
                        <Button
                          noPadding={true}
                          appearance="gray-link"
                          size="sm"
                          icon={<UilEye />}
                          onClick={() => setShowReveal(true)}
                        />
                      </StyledTooltip>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <ManageKeyPasswordDialog show={showReveal} setShow={setShowReveal} />
    </>
  );
}
