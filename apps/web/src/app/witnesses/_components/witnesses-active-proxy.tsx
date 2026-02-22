import React from "react";
import "./witness-active-proxy.scss";
import { Spinner } from "@ui/spinner";
import { Button } from "@ui/button";
import { error, LoginRequired, ProfileLink } from "@/features/shared";
import { formatError } from "@/api/format-error";
import i18next from "i18next";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useWitnessProxyMutation } from "@/api/sdk-mutations";

interface Props {
  username: string;
  onDone: () => void;
  isProxy: boolean;
}

export function WitnessesActiveProxy({ username, isProxy, onDone }: Props) {
  const { activeUser } = useActiveAccount();
  const { mutateAsync, isPending } = useWitnessProxyMutation();

  const removeProxy = async () => {
    try {
      await mutateAsync({ proxy: "" });
      onDone();
    } catch (e) {
      error(...formatError(e));
    }
  };

  return (
    <div className="witnesses-active-proxy" style={{ marginBottom: "50px" }}>
      {isProxy ? (
        <>
          <p className="description">{i18next.t("witnesses.proxy-active-description")}</p>
          <div className="proxy-form">
            <div className="current-proxy">
              {i18next.t("witnesses.proxy-active-current")}{" "}
              <ProfileLink username={username}>
                <span>{`@${username}`}</span>
              </ProfileLink>
            </div>

            {activeUser ? (
              <Button
                disabled={isPending}
                icon={isPending && <Spinner className="mr-[6px] w-3.5 h-3.5" />}
                iconPlacement="left"
                appearance="secondary"
                onClick={removeProxy}
              >
                {i18next.t("witnesses.proxy-active-btn-label")}
              </Button>
            ) : (
              <LoginRequired>
                <Button
                  disabled={isPending}
                  icon={isPending && <Spinner className="mr-[6px] w-3.5 h-3.5" />}
                  iconPlacement="left"
                >
                  {i18next.t("witnesses.proxy-active-btn-label")}
                </Button>
              </LoginRequired>
            )}

            <p className="description">{i18next.t("witnesses.proxy-active-highlighted")}</p>
          </div>
        </>
      ) : (
        <div className="current-proxy">
          <ProfileLink username={username}>
            <span>{`@${username}'s `}</span>
          </ProfileLink>
          {i18next.t("witnesses.check-witness-highlighted")}
        </div>
      )}
    </div>
  );
}

export default WitnessesActiveProxy;
