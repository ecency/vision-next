import { t } from "@/core";
import { TippingCurrencyCards } from "./tipping-currency-cards";

interface TippingStepCurrencyProps {
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

export function TippingStepCurrency({
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
      {selectedAsset !== undefined && (
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
        <button
          type="button"
          disabled={!canSubmit}
          className="px-3 py-2 rounded-md bg-theme-accent text-theme-accent-contrast text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSubmit}
        >
          {loading ? t("tip_sending") : t("tip_send")}
        </button>
      </div>
    </>
  );
}
