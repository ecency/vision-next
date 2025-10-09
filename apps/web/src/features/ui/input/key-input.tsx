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
import { deriveHiveKeys, detectHiveKeyDerivation } from "@/features/wallet/sdk";
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

export const KeyInput = forwardRef<
  KeyInputImperativeHandle,
  Props & Omit<HTMLProps<HTMLInputElement>, "ref" | "type">
>((props, ref) => {
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
      }

      let privateKey: PrivateKey;
      const derivation = await detectHiveKeyDerivation(activeUser.username, key, props.keyType);
      if (derivation === "bip44") {
        const keys = deriveHiveKeys(key);
        privateKey = PrivateKey.from(keys.owner);
      } else if (derivation === "master-password") {
        privateKey = PrivateKey.fromLogin(activeUser.username, key, props.keyType);
      } else {
        privateKey = PrivateKey.from(key);
      }

      if (cryptoUtils.isWif(key)) {
        privateKey = PrivateKey.fromString(key);
      } else {
        privateKey = PrivateKey.fromLogin(activeUser.username, key);
      }

      setSigningKey(key);

      props.onSign?.(privateKey);

      return { privateKey, raw: key };
    },
    [activeUser, key, props, setSigningKey]
  );

  useImperativeHandle(ref, () => ({
    handleSign
  }));

  return (
    <div
      className={clsx(
        "border-2 border-[--border-color] rounded-xl p-2 cursor-text flex flex-col items-start",
        props.className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-sm font-semibold text-gray-500 -mt-5 px-1 bg-white">
        {i18next.t("key-or-hot.key-placeholder")}
      </span>
      <div className="w-full grid gap-2 grid-cols-[max-content_1fr_max-content] items-center h-8">
        <UilLock className="w-5 h-5 text-gray-500" />

        <input
          ref={inputRef}
          className="outline-none"
          {...props}
          value={key}
          type="password"
          onChange={(e) => setKey(e.target.value)}
        />
        {props.onSign && (
          <Button size="sm" disabled={props.isLoading} onClick={handleSign}>
            {i18next.t("key-or-hot.sign")}
          </Button>
        )}
      </div>
    </div>
  );
});

KeyInput.displayName = "KeyInput";
