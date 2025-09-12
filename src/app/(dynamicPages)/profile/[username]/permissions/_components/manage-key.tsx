import { useClientActiveUser } from "@/api/queries";
import { Button, StyledTooltip } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilCopy, UilEye } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";
import { useCopyToClipboard } from "react-use";
import { ManageKeyPasswordDialog } from "./manage-key-password-dialog";
import { useRevealedKeysStore } from "../_hooks";

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

  return (
    <>
      <div className="p-4 flex flex-col gap-2">
        <div className="font-semibold">{i18next.t(`manage-authorities.${keyName}`)}</div>
        {accountData?.[keyName].map((key) => (
          <div
            className="bg-gray-100 w-full rounded-lg p-2 border border-[--border-color] flex items-center justify-between"
            key={key[0]}
          >
            <div className="flex flex-col gap-2 w-full">
              <div>
                <div className="text-sm opacity-75">Public</div>
                <div className="grid grid-cols-[1fr_max-content] items-center font-mono truncate">
                  <div className="truncate">{key[0]}</div>
                  <Button
                    appearance="gray-link"
                    size="sm"
                    icon={<UilCopy />}
                    onClick={() => copy(key[0])}
                  />
                </div>
              </div>

              <div>
                <div className="text-sm opacity-75">Private</div>
                <div className="grid grid-cols-[1fr_max-content] items-center font-mono truncate">
                  {keys[key[0]] && <div className="truncate">{keys[key[0]]}</div>}
                  {!keys[key[0]] && (
                    <div className="truncate">
                      ************************************************************************
                    </div>
                  )}
                  <div className="flex">
                    {keys[key[0]] && (
                      <Button
                        appearance="gray-link"
                        size="sm"
                        icon={<UilCopy />}
                        onClick={() => copy(keys[keyName])}
                      />
                    )}
                    {!keys[key[0]] && (
                      <StyledTooltip content={i18next.t("manage-authorities.reveal-private-key")}>
                        <Button
                          appearance="gray-link"
                          size="sm"
                          icon={<UilEye />}
                          onClick={() => setShowReveal(true)}
                        />
                      </StyledTooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ManageKeyPasswordDialog show={showReveal} setShow={setShowReveal} />
    </>
  );
}
