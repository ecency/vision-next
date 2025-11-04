import React from "react";
import { TransferAsset } from "@/features/shared";
import { getTokenLogo } from "@/features/wallet";

interface AssetSwitchProps {
  options: TransferAsset[];
  selected: TransferAsset;
  onChange: (i: TransferAsset) => void;
}
export function TransferAssetSwitch({ options, selected, onChange }: AssetSwitchProps) {
  return (
    <div className="asset-switch">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`asset inline-flex items-center gap-2 ${selected === opt ? "selected" : ""}`}
        >
          <span className="inline-flex items-center justify-center">{getTokenLogo(opt, 24)}</span>
          <span>{opt}</span>
        </button>
      ))}
    </div>
  );
}
