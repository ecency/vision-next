"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/features/auth/hooks";
import {
  executeTip,
  resolveFromAccountFromKey,
  resolvePrivateKey,
} from "../utils/tip-transaction";
import { TippingStepAmount } from "./tipping-step-amount";
import { TippingStepCurrency } from "./tipping-step-currency";
import type { TippingAsset } from "../types";

interface TippingPopoverProps {
  to: string;
  memo: string;
  presetAmounts: number[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | undefined>;
}

type Step = "amount" | "currency";

export function TippingPopover({
  to,
  memo,
  presetAmounts,
  onClose,
  anchorRef,
}: TippingPopoverProps) {
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<Step>("amount");
  const [selectedPreset, setSelectedPreset] = useState<
    number | "custom" | undefined
  >(undefined);
  const [amount, setAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string | undefined>(
    undefined,
  );
  const [privateKeyStr, setPrivateKeyStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const amountNum = parseFloat(amount);
  const hasValidAmount = Number.isFinite(amountNum) && amountNum > 0;
  const hasKeyInput = privateKeyStr.trim().length > 0;
  const canSubmit =
    hasValidAmount && selectedAsset !== undefined && hasKeyInput && !loading;

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (
        panel?.contains(e.target as Node) ||
        anchor?.contains(e.target as Node)
      ) {
        return;
      }
      onClose();
    },
    [anchorRef, onClose],
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
    if (!canSubmit) return;
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
      const key = await resolvePrivateKey(privateKeyStr.trim(), user?.username);
      let from: string;
      if (user?.username) {
        from = user.username;
      } else {
        from = await resolveFromAccountFromKey(key);
      }
      await executeTip({
        from,
        to,
        amount,
        asset: selectedAsset as TippingAsset,
        key,
        memo,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }, [
    canSubmit,
    privateKeyStr,
    user?.username,
    to,
    amount,
    selectedAsset,
    memo,
    onClose,
  ]);

  const anchor = anchorRef.current;
  const rect = anchor?.getBoundingClientRect();
  const style = rect
    ? {
        position: "fixed" as const,
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 9999,
      }
    : undefined;

  const content = (
    <div
      ref={panelRef}
      className="min-w-[280px] max-w-[340px] rounded-lg border border-theme bg-theme-primary shadow-lg p-4 font-theme-ui text-theme-primary"
      style={style}
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
          amount={amount}
          onAmountChange={setAmount}
          selectedAsset={selectedAsset}
          onAssetSelect={setSelectedAsset}
          privateKeyStr={privateKeyStr}
          onPrivateKeyChange={(v) => {
            setPrivateKeyStr(v);
            setError(undefined);
          }}
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
