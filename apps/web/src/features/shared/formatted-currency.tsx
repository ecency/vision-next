import { useGlobalStore } from "@/core/global-store";
import { formattedNumber } from "@/utils";

interface Props {
  value: number;
  fixAt?: number;
  /**
   * Skip currency conversion. Use this when the value is already in the user's preferred currency.
   * For example, when displaying prices from portfolio API that already returns fiatRate in user's currency.
   */
  skipConversion?: boolean;
}
export function FormattedCurrency({ value, fixAt = 2, skipConversion = false }: Props) {
  const currencyRate = useGlobalStore((state) => state.currencyRate);
  const currencySymbol = useGlobalStore((state) => state.currencySymbol);

  const displayValue = skipConversion ? value : value * currencyRate;

  return (
    <>{formattedNumber(displayValue, { fractionDigits: fixAt, prefix: currencySymbol })}</>
  );
}
