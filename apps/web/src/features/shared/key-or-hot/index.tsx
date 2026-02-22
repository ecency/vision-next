"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useIsMobile } from "@/utils";
import { PrivateKey } from "@hiveio/dhive";
import { Button } from "@ui/button";
import { KeyInput } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import { OrDivider } from "../or-divider";
import "./index.scss";
import { shouldUseHiveAuth } from "@/utils/client";
import { isKeychainInAppBrowser } from "@/utils/keychain";

interface Props {
  inProgress: boolean;
  onKey: (key: PrivateKey) => void;
  onHot?: () => void;
  onKc?: () => void;
  keyOnly?: boolean;
  authority: "owner" | "active";
}

export function KeyOrHot({ inProgress, onKey, onHot, onKc, keyOnly, authority="active" }: Props) {
  const { activeUser } = useActiveAccount();
  const isMobileBrowser = useIsMobile();
  const useHiveAuth = shouldUseHiveAuth(activeUser?.username);
  const canRenderKeychain = onKc && (!isMobileBrowser || useHiveAuth || isKeychainInAppBrowser());
  const keychainIcon = useHiveAuth ? "/assets/hive-auth.svg" : "/assets/keychain.png";
  const keychainAlt = useHiveAuth ? "hiveauth" : "keychain";
  const keychainLabel = useHiveAuth
    ? i18next.t("key-or-hot.with-hiveauth", { defaultValue: "Sign with HiveAuth" })
    : i18next.t("key-or-hot.with-keychain");

  return (
    <>
      <div className="key-or-hot">
        <KeyInput onSign={onKey} keyType={authority}/>
        {!keyOnly && (
          <>
            <OrDivider />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                outline={true}
                appearance="hivesigner"
                onClick={() => onHot?.()}
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
                      src={keychainIcon}
                      className="w-4 h-4"
                      alt={keychainAlt}
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
