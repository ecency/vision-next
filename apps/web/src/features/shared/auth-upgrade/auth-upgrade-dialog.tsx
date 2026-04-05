"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Button } from "@ui/button";
import { KeyInput } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import { PrivateKey } from "@ecency/hive-tx";
import { MetaMaskSignButton } from "../metamask-sign-button";
import { resolveAuthUpgrade } from "./auth-upgrade-events";
import { shouldUseKeychainMobile } from "@/utils/client";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { isKeychainInAppBrowser } from "@/utils/keychain";
import { useIsMobile } from "@/utils";
import { getLoginType } from "@/utils/user-token";

interface AuthUpgradeRequest {
  authority: string;
  operation: string;
}

export function AuthUpgradeDialog() {
  const { activeUser } = useActiveAccount();
  const isMobileBrowser = useIsMobile();
  const [request, setRequest] = useState<AuthUpgradeRequest | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AuthUpgradeRequest>).detail;
      setRequest(detail);
    };
    window.addEventListener("ecency-auth-upgrade", handler);
    return () => window.removeEventListener("ecency-auth-upgrade", handler);
  }, []);

  const handleClose = useCallback(() => {
    setRequest(null);
    resolveAuthUpgrade(false);
  }, []);

  const handleKeySign = useCallback((privateKey: PrivateKey) => {
    setRequest(null);
    // Convert PrivateKey to WIF string for the adapter's getActiveKey
    resolveAuthUpgrade("key", privateKey.toString());
  }, []);

  const handleHiveSigner = useCallback(() => {
    setRequest(null);
    resolveAuthUpgrade("hivesigner");
  }, []);

  const handleKeychainOrMobile = useCallback(() => {
    setRequest(null);
    // For keychain-mobile users, resolve as "keychain" — the adapter's
    // broadcastWithKeychain detects keychain-mobile and opens hive:// deep link
    resolveAuthUpgrade("keychain");
  }, []);

  const handleMetaMask = useCallback(() => {
    setRequest(null);
    // Resolve as 'keychain' — the adapter's broadcastWithKeychain detects
    // metamask login type and routes to the Hive snap automatically
    resolveAuthUpgrade("keychain");
  }, []);

  if (!request) return null;

  const authority = (request.authority || "active") as "posting" | "active" | "owner";
  const isMetaMaskUser = activeUser && getLoginType(activeUser.username) === "metamask";
  const useKcMobile = shouldUseKeychainMobile(activeUser?.username);
  const showKeychainBtn = !isMetaMaskUser && (!isMobileBrowser || useKcMobile || isKeychainInAppBrowser());
  const keychainLabel = useKcMobile
    ? i18next.t("key-or-hot.with-keychain-mobile", { defaultValue: "Sign with Keychain Mobile" })
    : i18next.t("key-or-hot.with-keychain");

  return (
    <Modal show={true} centered={true} onHide={handleClose}>
      <ModalHeader closeButton={true}>
        <ModalTitle>
          {i18next.t("trx-common.sign-title")}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600 mb-4">
          {i18next.t("trx-common.sign-sub-title")}
        </p>
        <div className="flex flex-col gap-3">
          {isMetaMaskUser ? (
            <MetaMaskSignButton onClick={handleMetaMask} />
          ) : (
            <>
              <KeyInput onSign={handleKeySign} keyType={authority} />
              <div className="flex items-center gap-2 my-1">
                <hr className="flex-1" />
                <span className="text-xs text-gray-400">
                  {i18next.t("g.or", { defaultValue: "or" })}
                </span>
                <hr className="flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  outline={true}
                  appearance="hivesigner"
                  onClick={handleHiveSigner}
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
                {showKeychainBtn && (
                  <Button
                    outline={true}
                    appearance="secondary"
                    onClick={handleKeychainOrMobile}
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
      </ModalBody>
    </Modal>
  );
}
