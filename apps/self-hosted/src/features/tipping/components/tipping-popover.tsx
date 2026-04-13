"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/features/auth/hooks";
import { executeTip } from "../utils/tip-transaction";
import { TippingStepAmount } from "./tipping-step-amount";
import { TippingStepCurrency } from "./tipping-step-currency";
import { isExternalWalletAsset, type TippingAsset } from "../types";

interface TippingPopoverRefs {
  setReference: (element: HTMLElement | null) => void;
  setFloating: (element: HTMLElement | null) => void;
  reference: React.RefObject<unknown>;
  floating: React.RefObject<unknown>;
}

interface TippingPopoverProps {
  to: string;
  memo: string;
  presetAmounts: number[];
  onClose: () => void;
  refs: TippingPopoverRefs;
  floatingStyles: React.CSSProperties;
}

type Step = "amount" | "currency";

export function TippingPopover({
  to,
  memo,
  presetAmounts,
  onClose,
  refs,
  floatingStyles,
}: TippingPopoverProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("amount");
  const [selectedPreset, setSelectedPreset] = useState<
    number | "custom" | undefined
  >(undefined);
  const [amount, setAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const amountNum = parseFloat(amount);
  const hasValidAmount = Number.isFinite(amountNum) && amountNum > 0;
  const isExternalAsset =
    selectedAsset !== undefined && isExternalWalletAsset(selectedAsset);
  const canSubmit =
    hasValidAmount &&
    selectedAsset !== undefined &&
    !isExternalAsset &&
    !!user?.username &&
    !loading;

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const refRef = refs.reference.current;
      const refFloating = refs.floating.current;
      const referenceEl =
        refRef != null && typeof refRef === "object" && "contains" in refRef
          ? (refRef as HTMLElement)
          : null;
      const floatingEl =
        refFloating != null &&
        typeof refFloating === "object" &&
        "contains" in refFloating
          ? (refFloating as HTMLElement)
          : null;
      if (
        floatingEl?.contains(e.target as Node) ||
        referenceEl?.contains(e.target as Node)
      ) {
        return;
      }
      onClose();
    },
    [refs.reference, refs.floating, onClose],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handlePreset = (value: number | "custom") => {
    setSelectedPreset(value);
    setAmount(value === "custom" ? "" : String(value));
    setStep("currency");
    setError(undefined);
  };

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !user?.username) return;
    if (
      selectedAsset !== "HIVE" &&
      selectedAsset !== "HBD" &&
      selectedAsset !== "POINTS"
    ) {
      setError("This asset is not supported for tipping yet");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await executeTip({
        from: user.username,
        to,
        amount,
        asset: selectedAsset as TippingAsset,
        memo,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, user?.username, to, amount, selectedAsset, memo, onClose]);

  const content = (
    <div
      ref={refs.setFloating}
      className="min-w-[280px] max-w-[340px] rounded-lg border border-theme bg-theme-primary shadow-lg p-4 font-theme-ui text-theme-primary z-9999"
      style={floatingStyles}
      role="dialog"
      aria-label="Tip"
    >
      {step === "amount" && (
        <TippingStepAmount
          presetAmounts={presetAmounts}
          onSelect={handlePreset}
        />
      )}
      {step === "currency" && (
        <TippingStepCurrency
          to={to}
          amount={amount}
          onAmountChange={setAmount}
          selectedAsset={selectedAsset}
          onAssetSelect={setSelectedAsset}
          error={error}
          canSubmit={canSubmit}
          loading={loading}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
