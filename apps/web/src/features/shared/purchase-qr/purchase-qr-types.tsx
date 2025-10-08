"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FormControl } from "@ui/input";
import i18next from "i18next";

interface Props {
  className?: string;
  value: string;
  setValue?: (value: string) => void;
}

const ITEMS = [
  { value: "099points", title: i18next.t("purchase-qr.points-amount", { n: "500" }) },
  { value: "199points", title: i18next.t("purchase-qr.points-amount", { n: "1100" }) },
  { value: "499points", title: i18next.t("purchase-qr.points-amount", { n: "2700" }) },
  { value: "999points", title: i18next.t("purchase-qr.points-amount", { n: "5500" }) },
  { value: "4999points", title: i18next.t("purchase-qr.points-amount", { n: "28500" }) },
  { value: "9999points", title: i18next.t("purchase-qr.points-amount", { n: "60000" }) }
];

export const PurchaseQrTypes = ({ value, setValue, className }: Props) => {
  return (
    <FormControl
      type="select"
      autoFocus={true}
      placeholder={i18next.t("purchase-qr.select-amount")}
      value={value}
      className={className}
      onChange={(e) => setValue?.((e.target as any).selected)}
    >
      {ITEMS.map((item) => (
        <option key={item.value} value={item.value}>
          {item.title}
        </option>
      ))}
    </FormControl>
  );
};
