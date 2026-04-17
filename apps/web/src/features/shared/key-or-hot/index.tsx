"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useIsMobile } from "@/utils";
import { PrivateKey } from "@ecency/sdk";
import { Button } from "@ui/button";
import { KeyInput } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import { OrDivider } from "../or-divider";
import { MetaMaskSignButton } from "../metamask-sign-button";
import "./index.scss";
import { shouldUseKeychainMobile } from "@/utils/client";
import { isKeychainInAppBrowser } from "@/utils/keychain";
import { getLoginType } from "@/utils/user-token";

interface Props {
  inProgress: boolean;
  onKey: (key: PrivateKey) => void;
  onHot?: () => void;
  onKc?: () => void;
  onMetaMask?: () => void;
  keyOnly?: boolean;
  authority?: "owner" | "active";
}

export function KeyOrHot({ inProgress, onKey, onHot, onKc, onMetaMask, keyOnly, authority="active" }: Props) {
  const { activeUser } = useActiveAccount();
  const isMobileBrowser = useIsMobile();
  const useKcMobile = shouldUseKeychainMobile(activeUser?.username);
  const isMetaMaskUser = activeUser && getLoginType(activeUser.username) === "metamask";
  const canRenderKeychain = !isMetaMaskUser && onKc && (!isMobileBrowser || useKcMobile || isKeychainInAppBrowser());
  const keychainLabel = useKcMobile
    ? i18next.t("key-or-hot.with-keychain-mobile", { defaultValue: "Sign with Keychain Mobile" })
    : i18next.t("key-or-hot.with-keychain");

  if (isMetaMaskUser && onMetaMask && !keyOnly) {
    return (
      <div className="key-or-hot">
        <MetaMaskSignButton onClick={() => onMetaMask()} />
      </div>
    );
  }

  return (
    <>
      <div className="key-or-hot">
        <KeyInput onSign={onKey} keyType={authority}/>
        {!keyOnly && (onHot || canRenderKeychain) && (
          <>
            <OrDivider />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onHot && (
                <Button
                  size="lg"
                  outline={true}
                  appearance="hivesigner"
                  onClick={() => onHot()}
                  icon={
                    <Image
                      width={100}
                      height={100}
                      src="/assets/hive-signer.svg"
                      className="w-4 h-4"
                      alt="hivesigner"
                    />
                  }
                >
                  {i18next.t("key-or-hot.with-hivesigner")}
                </Button>
              )}

              {canRenderKeychain && (
                <Button
                  outline={true}
                  appearance="secondary"
                  size="lg"
                  onClick={onKc}
                  icon={
                    <Image
                      width={100}
                      height={100}
                      src="/assets/keychain.png"
                      className="w-4 h-4"
                      alt="keychain"
                    />
                  }
                >
                  {keychainLabel}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
