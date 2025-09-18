"use client";

import React, { useCallback, useState } from "react";
import { cryptoUtils, PrivateKey } from "@hiveio/dhive";
import { OrDivider } from "../or-divider";
import "./index.scss";
import { FormControl, InputGroup } from "@ui/input";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { keySvg } from "@ui/svg";
import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import Image from "next/image";

interface Props {
  inProgress: boolean;
  onKey: (key: PrivateKey) => void;
  onHot?: () => void;
  onKc?: () => void;
  keyOnly?: boolean;
}

export function KeyOrHot({ inProgress, onKey, onHot, onKc, keyOnly }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const signingKey = useGlobalStore((state) => state.signingKey);
  const setSigningKey = useGlobalStore((state) => state.setSigningKey);

  const [keyInput, setKeyInput] = useState(signingKey ?? "");

  const keyEntered = useCallback(() => {
    if (!activeUser) {
      throw new Error("Cannot sign operation with anon user");
    }

    let privateKey: PrivateKey;
    if (cryptoUtils.isWif(keyInput)) {
      privateKey = PrivateKey.fromString(keyInput);
    } else {
      privateKey = PrivateKey.fromLogin(activeUser.username, keyInput);
    }

    setSigningKey(keyInput);

    onKey(privateKey);
  }, [activeUser, keyInput, onKey, setSigningKey]);

  return (
    <>
      <div className="key-or-hot">
        <InputGroup
          prepend={keySvg}
          append={
            <Button disabled={inProgress} onClick={keyEntered}>
              {i18next.t("key-or-hot.sign")}
            </Button>
          }
        >
          <FormControl
            value={keyInput}
            type="password"
            autoFocus={true}
            autoComplete="off"
            placeholder={i18next.t("key-or-hot.key-placeholder")}
            onChange={(e) => setKeyInput(e.target.value)}
          />
        </InputGroup>
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

              {onKc && (
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
                  {i18next.t("key-or-hot.with-keychain")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
