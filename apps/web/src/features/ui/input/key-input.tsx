"use client";

import { UilLock } from "@tooni/iconscout-unicons-react";
import { Button } from "..";
import i18next from "i18next";
import { cryptoUtils, PrivateKey } from "@hiveio/dhive";
import {
  forwardRef,
  HTMLProps,
  MouseEvent,
  useCallback,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { useClientActiveUser } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { deriveHiveKeys, detectHiveKeyDerivation } from "@ecency/wallets";
import { error } from "@/features/shared";
import clsx from "clsx";

interface Props {
  isLoading?: boolean;
  onSign?: (key: PrivateKey) => void;
  keyType?: "owner" | "active";
}

export interface KeyInputImperativeHandle {
  handleSign: (e?: MouseEvent) => Promise<{
    privateKey: PrivateKey;
    raw: string;
  }>;
}

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return "";
  return str[0].toUpperCase() + str.slice(1);
}

export const KeyInput = forwardRef<
  KeyInputImperativeHandle,
  Props & Omit<HTMLProps<HTMLInputElement>, "ref" | "type">
>(({ onSign, isLoading, keyType, className, ...inputProps }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const activeUser = useClientActiveUser();
  const setSigningKey = useGlobalStore((state) => state.setSigningKey);

  const [key, setKey] = useState("");

  const handleSign = useCallback(
    async (e?: MouseEvent) => {
      e?.stopPropagation();

      if (!activeUser) {
        throw new Error("Cannot sign operation with anon user");
      }

      if (!key) {
        error(i18next.t("validation.required"));
        throw new Error("Cannot sign operation without a key");
      }

      let privateKey: PrivateKey;

      if (cryptoUtils.isWif(key)) {
        privateKey = PrivateKey.fromString(key);
      } else {
        const derivation = await detectHiveKeyDerivation(activeUser.username, key, keyType);

        if (derivation === "bip44") {
          const keys = deriveHiveKeys(key);
          const derivedKey = keyType === "active" ? keys.active : keys.owner;
          privateKey = PrivateKey.fromString(derivedKey);
        } else if (derivation === "master-password") {
          privateKey = PrivateKey.fromLogin(activeUser.username, key, keyType);
        } else {
          privateKey = PrivateKey.from(key);
        }
      }

      setSigningKey(key);

      onSign?.(privateKey);

      return { privateKey, raw: key };
    },
    [activeUser, key, keyType, onSign, setSigningKey]
  );

  useImperativeHandle(ref, () => ({
    handleSign
  }));

  return (
    <div
      className={clsx(
        "border-2 border-[--border-color] rounded-xl p-2 cursor-text flex flex-col items-start",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-sm font-semibold text-gray-500 -mt-5 px-1 bg-white">
        {capitalizeFirstLetter(keyType)} {i18next.t("key-or-hot.key-placeholder")}
      </span>
      <div className="w-full grid gap-2 grid-cols-[max-content_1fr_max-content] items-center h-8">
        <UilLock className="w-5 h-5 text-gray-500" />

        <input
          ref={inputRef}
          className="outline-none bg-transparent"
          {...inputProps}
          value={key}
          type="password"
          onChange={(e) => setKey(e.target.value)}
        />
        {onSign && (
          <Button size="sm" disabled={isLoading} onClick={handleSign}>
            {i18next.t("key-or-hot.sign")}
          </Button>
        )}
      </div>
    </div>
  );
});

KeyInput.displayName = "KeyInput";
