"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Button } from "@ui/button";
import { KeyInput } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import { PrivateKey } from "@ecency/sdk";
import { MetaMaskSignButton } from "../metamask-sign-button";
import { resolveAuthUpgrade } from "./auth-upgrade-events";
import { shouldUseKeychainMobile } from "@/utils/client";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useIsMobile } from "@/utils";
import { getLoginType } from "@/utils/user-token";
import {
  getDetectedExtensions,
  hasAnyHiveExtension,
  setPreferredExtensionId,
  type HiveExtensionId
} from "@/utils/hive-extensions";
import { isInAppBrowser } from "@/utils/keychain";

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

  // User explicitly chose a specific browser extension to sign with. Persist it
  // as the preference so `broadcastWithExtension` targets that extension's own
  // API (e.g. Keychain's `window.hive_keychain`) instead of auto-resolving
  // Keeper-first. This avoids the Keeper-vs-Keychain cross-talk where Keeper
  // stamps `extension_id` on the shared event channel and a co-installed,
  // not-yet-protocol-aware Keychain rejects it with
  // `ValidationError: "extension_id" is not allowed`.
  const handleExtensionChoice = useCallback((extId: HiveExtensionId) => {
    setRequest(null);
    setPreferredExtensionId(extId);
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
  const detectedExtensions = getDetectedExtensions();
  const showExtensionBtn = !isMetaMaskUser && (!isMobileBrowser || useKcMobile || isInAppBrowser() || hasAnyHiveExtension());
  const extensionLabel = useKcMobile
    ? i18next.t("key-or-hot.with-keychain-mobile", { defaultValue: "Sign with Keychain Mobile" })
    : i18next.t("key-or-hot.with-extension", { defaultValue: "Sign with Extension" });

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
                {showExtensionBtn &&
                  (detectedExtensions.length > 0 ? (
                    // One button per detected extension. Picking one persists it
                    // as the signing preference so we target that extension's own
                    // API directly — no Keeper-first auto-pick, no cross-talk.
                    detectedExtensions.map((ext) => (
                      <Button
                        key={ext.id}
                        outline={true}
                        appearance="secondary"
                        onClick={() => handleExtensionChoice(ext.id)}
                        icon={
                          <Image
                            width={20}
                            height={20}
                            src={ext.icon}
                            alt={ext.name}
                            className="w-4 h-4 rounded-sm"
                          />
                        }
                      >
                        {i18next.t("key-or-hot.with-extension-named", {
                          name: ext.name,
                          defaultValue: `Sign with ${ext.name}`
                        })}
                      </Button>
                    ))
                  ) : (
                    // No extension detected (e.g. Keychain Mobile / in-app
                    // WebView): keep the generic button — the adapter resolves
                    // the deep-link path from the login type.
                    <Button
                      outline={true}
                      appearance="secondary"
                      onClick={handleKeychainOrMobile}
                      icon={
                        <Image
                          width={20}
                          height={20}
                          src="/assets/keychain.png"
                          alt="extensions"
                          className="w-4 h-4"
                        />
                      }
                    >
                      {extensionLabel}
                    </Button>
                  ))}
              </div>
            </>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
