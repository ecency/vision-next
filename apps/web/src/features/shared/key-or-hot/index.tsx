"use client";

import { useGlobalStore } from "@/core/global-store";
import { PrivateKey } from "@hiveio/dhive";
import { Button } from "@ui/button";
import { KeyInput } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import { OrDivider } from "../or-divider";
import "./index.scss";

interface Props {
  inProgress: boolean;
  onKey: (key: PrivateKey) => void;
  onHot?: () => void;
  onKc?: () => void;
  keyOnly?: boolean;
  authority: "owner" | "active";
}

export function KeyOrHot({ inProgress, onKey, onHot, onKc, keyOnly, authority="active" }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);

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
