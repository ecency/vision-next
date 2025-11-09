import { useClientActiveUser } from "@/api/queries";
import { Button, StyledTooltip } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilCopy, UilEye, UilTrash } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";
import { useCopyToClipboard } from "react-use";
import { ManageKeyPasswordDialog } from "./manage-key-password-dialog";
import { useRevealedKeysStore } from "../_hooks";
import { ManageKeyRevokeDialog } from "./manage-key-revoke-dialog";

type Keys = Record<string, [string, number][]>;

interface Props {
  keyName: string;
}

export function ManageKey({ keyName }: Props) {
  const activeUser = useClientActiveUser();

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(activeUser?.username!),
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

  const [_, copy] = useCopyToClipboard();

  const [showReveal, setShowReveal] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [revokingKey, setRevokingKey] = useState("");

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
              <StyledTooltip
                content={i18next.t("chat.public-key")}
                className="grid grid-cols-[1fr_max-content] items-center font-mono gap-2 truncate"
              >
                <div className="truncate">{key[0]}</div>
                <Button
                  noPadding={true}
                  appearance="gray-link"
                  size="sm"
                  icon={<UilCopy />}
                  onClick={() => copy(key[0])}
                />
              </StyledTooltip>

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
                      onClick={() => copy(keys[keyName])}
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
                  {accountData?.[keyName].length > 1 && (
                    <StyledTooltip content={i18next.t("manage-authorities.revoke")}>
                      <Button
                        noPadding={true}
                        appearance="gray-link"
                        size="sm"
                        icon={<UilTrash />}
                        onClick={() => {
                          setShowRevoke(true);
                          setRevokingKey(keys[key[0]]);
                        }}
                      />
                    </StyledTooltip>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ManageKeyPasswordDialog show={showReveal} setShow={setShowReveal} />
      <ManageKeyRevokeDialog show={showRevoke} setShow={setShowRevoke} revokingKey={revokingKey} />
    </>
  );
}
