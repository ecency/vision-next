"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { success } from "../feedback";
import qrcode from "qrcode";
import defaults from "@/defaults.json";
import { PurchaseTypes } from "./purchase-types";
import { PurchaseQrTypes } from "@/features/shared/purchase-qr/purchase-qr-types";
import { SearchByUsername } from "@/features/shared/search-by-username";
import { InputGroupCopyClipboard } from "@ui/input";
import { Alert } from "@ui/alert";
import i18next from "i18next";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

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

    const params = new URLSearchParams(searchParams);
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

  const copyToClipboard = (text: string) => {
    const textField = document.createElement("textarea");
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
    success(i18next.t("purchase-qr.copied"));
  };

  return (
    <div className="flex flex-col items-center px-3 text-center">
      <h6>
        {isQrShow ? i18next.t("purchase-qr.scan-code") : i18next.t("purchase-qr.select-user")}
      </h6>
      <div className="w-full mt-4">
        <SearchByUsername
          setUsername={(value: string) => {
            setUsername(value);

            if (!value) {
              setIsQrShow(false);
            } else {
              compileQR(getURL());
            }
          }}
        />
        {type === PurchaseTypes.POINTS ? (
          <PurchaseQrTypes
            className="mt-3"
            value={pointsValue}
            setValue={(v: string) => setPointsValue(v)}
          />
        ) : (
          <></>
        )}
      </div>
      {mounted && (<Image
        width={600}
        height={600}
        ref={qrImgRef as any}
        alt="Boost QR Code"
        src=""
        className="my-4"
        style={{ display: isQrShow ? "block" : "none" }}
      />)}
      {isQrShow ? (
        <div className="w-full mb-4">
          <InputGroupCopyClipboard value={getURL()} />
        </div>
      ) : (
        <></>
      )}
      {type === PurchaseTypes.BOOST && isQrShow ? (
        <Alert className="text-left mt-3 mb-0 text-small">
          {i18next.t("purchase-qr.boost-info")}
        </Alert>
      ) : (
        <></>
      )}
    </div>
  );
};
