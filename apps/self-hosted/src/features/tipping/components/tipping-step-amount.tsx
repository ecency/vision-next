import { t } from "@/core";

interface TippingStepAmountProps {
  presetAmounts: number[];
  onSelect: (value: number | "custom") => void;
}

const buttonClassName =
  "px-3 py-2 rounded-md border border-theme bg-theme-primary text-theme-primary hover:bg-theme-tertiary text-sm";

export function TippingStepAmount({
  presetAmounts,
  onSelect,
}: TippingStepAmountProps) {
  return (
    <>
      <div className="text-sm font-medium mb-2 text-theme-muted">
        {t("tip_amount")}
      </div>
      <div className="flex flex-wrap gap-2">
        {presetAmounts.map((val) => (
          <button
            key={val}
            type="button"
            className={buttonClassName}
            onClick={() => onSelect(val)}
          >
            ${val}
          </button>
        ))}
        <button
          type="button"
          className={buttonClassName}
          onClick={() => onSelect("custom")}
        >
          {t("tip_custom")}
        </button>
      </div>
    </>
  );
}
