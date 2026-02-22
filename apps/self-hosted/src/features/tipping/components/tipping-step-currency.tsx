import { t } from "@/core";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import {
  isAssetRequiringKey,
  isExternalWalletAsset,
} from "../types";
import { TippingCurrencyCards } from "./tipping-currency-cards";
import { TippingWalletQr } from "./tipping-wallet-qr";

interface TippingStepCurrencyProps {
  to: string;
  amount: string;
  onAmountChange: (value: string) => void;
  selectedAsset: string | undefined;
  onAssetSelect: (asset: string) => void;
  privateKeyStr: string;
  onPrivateKeyChange: (value: string) => void;
  error: string | undefined;
  canSubmit: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const inputClassName =
  "w-full mb-3 px-3 py-2 rounded-md border border-theme bg-theme-primary text-theme-primary text-sm";
const inputMonoClassName = `${inputClassName} font-mono`;

function useRecipientWalletAddress(to: string, asset: string | undefined) {
  const enabled = !!to && !!asset && isExternalWalletAsset(asset);
  const { data: account } = useQuery({
    ...getAccountFullQueryOptions(to),
    enabled,
  });
  if (!enabled || !account?.profile?.tokens) return undefined;
  const token = account.profile.tokens.find(
    (t) => t.symbol?.toUpperCase() === asset?.toUpperCase(),
  );
  const address = token?.meta?.address;
  return typeof address === "string" && address.trim() ? address : undefined;
}

export function TippingStepCurrency({
  to,
  amount,
  onAmountChange,
  selectedAsset,
  onAssetSelect,
  privateKeyStr,
  onPrivateKeyChange,
  error,
  canSubmit,
  loading,
  onCancel,
  onSubmit,
}: TippingStepCurrencyProps) {
  const showKeyInput =
    selectedAsset !== undefined && isAssetRequiringKey(selectedAsset);
  const isExternal = selectedAsset !== undefined && isExternalWalletAsset(selectedAsset);
  const recipientAddress = useRecipientWalletAddress(to, selectedAsset);

  return (
    <>
      <div className="text-sm font-medium mb-2 text-theme-muted">
        {t("tip_amount")}
      </div>
      <input
        type="number"
        min="0"
        step="0.001"
        placeholder="0"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        className={inputClassName}
      />
      <div className="text-sm font-medium mb-2 text-theme-muted">
        {t("tip_currency")}
      </div>
      <TippingCurrencyCards
        selectedAsset={selectedAsset}
        onAssetSelect={onAssetSelect}
      />
      {showKeyInput && (
        <>
          <div className="text-sm font-medium mb-2 text-theme-muted">
            {t("tip_private_key")}
          </div>
          <input
            type="password"
            autoComplete="off"
            placeholder="Active key"
            value={privateKeyStr}
            onChange={(e) => onPrivateKeyChange(e.target.value)}
            className={inputMonoClassName}
          />
        </>
      )}
      {isExternal && (
        <>
          <div className="text-sm font-medium mb-2 text-theme-muted">
            {t("tip_wallet_address")}
          </div>
          {recipientAddress ? (
            <div className="mb-3 flex flex-col items-center gap-2">
              <TippingWalletQr address={recipientAddress} size={180} />
              <span className="break-all font-mono text-xs text-theme-muted">
                {recipientAddress}
              </span>
            </div>
          ) : (
            <div className="mb-3 rounded border border-theme bg-theme-tertiary px-3 py-2 text-sm text-theme-muted">
              {t("tip_no_wallet_address")}
            </div>
          )}
        </>
      )}
      {error && (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded-md border border-theme text-theme-muted text-sm hover:bg-theme-tertiary"
          onClick={onCancel}
        >
          {t("cancel")}
        </button>
        {!isExternal && (
          <button
            type="button"
            disabled={!canSubmit}
            className="px-3 py-2 rounded-md bg-theme-accent text-theme-accent-contrast text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSubmit}
          >
            {loading ? t("tip_sending") : t("tip_send")}
          </button>
        )}
      </div>
    </>
  );
}
