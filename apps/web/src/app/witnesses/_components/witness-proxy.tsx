import { useCallback, useState } from "react";
import { formatError, witnessProxy, witnessProxyHot, witnessProxyKc } from "@/api/operations";
import { Spinner } from "@ui/spinner";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { error, KeyOrHotDialog, LoginRequired } from "@/features/shared";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import "./witness-proxy.scss";

interface Props {
  onDone: () => void;
}

export function WitnessesProxy({ onDone }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const [username, setUsername] = useState("");
  const [inProgress, setInProgress] = useState(false);

  const proxy = useCallback(
    (fn: any, args: any[]) => {
      const fnArgs = [...args];
      const call = fn(...fnArgs);

      if (typeof call?.then === "function") {
        setInProgress(true);

          call
            .then(() => {
              onDone();
              setUsername("");
            })
          .catch((e: any) => {
            error(...formatError(e));
          })
          .finally(() => {
            setInProgress(false);
          });
      }
    },
      [username, onDone]
  );

  return (
    <div className="witnesses-proxy">
      <p className="description">{i18next.t("witnesses.proxy-description")}</p>
      <div className="proxy-form">
        <div className="txt-username">
          <FormControl
            type="text"
            placeholder={i18next.t("witnesses.username-placeholder")}
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value.trim())}
            disabled={inProgress}
          />
        </div>
        <div>
          {activeUser ? (
            username ? (
              <KeyOrHotDialog
                onKey={(key) => proxy(witnessProxy, [activeUser!.username, key, username])}
                onHot={() => proxy(witnessProxyHot, [activeUser!.username, username])}
                onKc={() => proxy(witnessProxyKc, [activeUser!.username, username])}
              >
                <Button
                  disabled={inProgress}
                  icon={inProgress && <Spinner className="mr-[6px] w-3.5 h-3.5" />}
                  iconPlacement="left"
                >
                  {i18next.t("witnesses.proxy-btn-label")}
                </Button>
              </KeyOrHotDialog>
            ) : (
              <Button disabled={true}>{i18next.t("witnesses.proxy-btn-label")}</Button>
            )
          ) : (
            <LoginRequired>
              <Button
                disabled={inProgress}
                icon={inProgress && <Spinner className="mr-[6px] w-3.5 h-3.5" />}
                iconPlacement="left"
              >
                {i18next.t("witnesses.proxy-btn-label")}
              </Button>
            </LoginRequired>
          )}
        </div>
      </div>
    </div>
  );
}
