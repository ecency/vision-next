"use client";

import defaults from "@/defaults";
import { PurchaseQrTypes } from "@/features/shared/purchase-qr/purchase-qr-types";
import { SearchByUsername } from "@/features/shared/search-by-username";
import { Alert } from "@ui/alert";
import { InputGroupCopyClipboard } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import qrcode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { PurchaseTypes } from "./purchase-types";

interface Props {
  username?: string;
  queryType?: PurchaseTypes;
  queryProductId?: string;
}

export const PurchaseQrBuilder = ({ queryType, queryProductId, username: propUsername }: Props) => {
  const [username, setUsername] = useState(propUsername ?? "");
  const qrImgRef = useRef<HTMLImageElement | undefined>();
  const [isQrShow, setIsQrShow] = useState(false);
  const [type, setType] = useState(PurchaseTypes.BOOST);
  const [pointsValue, setPointsValue] = useState("999points");
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (queryType) {
      setType(queryType);
    }
  }, [queryType]);

  useEffect(() => {
    if (queryProductId) {
      setPointsValue(queryProductId);
    }
  }, [queryProductId]);

  const getURL = useCallback(() => {
    const url = new URL(defaults.base);
    url.pathname = "purchase";

    const params = new URLSearchParams(searchParams ?? "");
    params.set("username", username);
    params.set("type", type);
    params.set("product_id", pointsValue);
    url.search = params.toString();
    return url.toString();
  }, [pointsValue, searchParams, type, username]);

  useEffect(() => {
    if (username) {
      compileQR(getURL());
    }
  }, [username, type, pointsValue, searchParams, getURL]);

  const compileQR = async (url: string) => {
    if (qrImgRef.current) {
      qrImgRef.current.src = await qrcode.toDataURL(url, { width: 300 });
      setIsQrShow(true);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col gap-2 md:gap-4">
        <div>
          {isQrShow ? i18next.t("purchase-qr.scan-code") : i18next.t("purchase-qr.select-user")}
        </div>
        <SearchByUsername
          username={username}
          setUsername={(value) => {
            setUsername(value);

            if (!value) {
              setIsQrShow(false);
            } else {
              compileQR(getURL());
            }
          }}
        />
        {type === PurchaseTypes.POINTS && (
          <PurchaseQrTypes value={pointsValue} setValue={(v: string) => setPointsValue(v)} />
        )}
        {isQrShow && <InputGroupCopyClipboard value={getURL()} />}
        {type === PurchaseTypes.BOOST && isQrShow && (
          <Alert>{i18next.t("purchase-qr.boost-info")}</Alert>
        )}
      </div>
      <div className="flex flex-col items-center">
        <div className="w-[240px] h-[240px] border rounded-xl overflow-hidden border-[--border-color] my-4">
          <Image
            width={240}
            height={240}
            ref={qrImgRef as any}
            alt="Boost QR Code"
            src=""
            style={{ display: isQrShow ? "block" : "none" }}
          />
        </div>
      </div>
    </div>
  );
};
