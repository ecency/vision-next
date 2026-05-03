import React, { ChangeEvent, useState } from "react";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { allStakeSvg, buyStakeSvg, sellStakeSvg } from "@ui/svg";
import i18next from "i18next";

export enum StakeWidgetViewType {
  All = "all",
  Sell = "sell",
  Buy = "buy"
}

interface Props {
  viewType: StakeWidgetViewType;
  fraction: number;
  onFractionChange: (value: number) => void;
  onViewTypeChange: (value: StakeWidgetViewType) => void;
}

export const StakeWidgetHeaderOptions = ({
  fraction,
  onFractionChange,
  viewType,
  onViewTypeChange
}: Props) => {
  const [fractionValue, setFractionValue] = useState(fraction);

  return (
    <div className="stake-widget-header-options flex-wrap">
      <div className="stake-widget-header-view-type">
        <Button
          appearance="link"
          size="sm"
          className={viewType === StakeWidgetViewType.All ? "active" : ""}
          onClick={() => onViewTypeChange(StakeWidgetViewType.All)}
          icon={allStakeSvg}
          aria-label={i18next.t("market.advanced-mode.show-all", { defaultValue: "Show all orders" })}
          aria-pressed={viewType === StakeWidgetViewType.All}
        />
        <Button
          appearance="link"
          size="sm"
          className={viewType === StakeWidgetViewType.Buy ? "active" : ""}
          onClick={() => onViewTypeChange(StakeWidgetViewType.Buy)}
          icon={buyStakeSvg}
          aria-label={i18next.t("market.advanced-mode.show-buy", { defaultValue: "Show buy orders" })}
          aria-pressed={viewType === StakeWidgetViewType.Buy}
        />
        <Button
          appearance="link"
          size="sm"
          className={viewType === StakeWidgetViewType.Sell ? "active" : ""}
          onClick={() => onViewTypeChange(StakeWidgetViewType.Sell)}
          icon={sellStakeSvg}
          aria-label={i18next.t("market.advanced-mode.show-sell", { defaultValue: "Show sell orders" })}
          aria-pressed={viewType === StakeWidgetViewType.Sell}
        />
      </div>

      <FormControl
        type="select"
        placeholder={i18next.t("wallet.spk.delegate.node-operator-placeholder")}
        className="text-xs"
        value={fractionValue}
        onChange={(event: ChangeEvent<any>) => {
          setFractionValue(+event.target.value);
          onFractionChange(+event.target.value);
        }}
      >
        <option value="0.00001">0.00001</option>
        <option value="0.0001">0.0001</option>
        <option value="0.001">0.001</option>
        <option value="0.01">0.01</option>
        <option value="0.1">0.1</option>
      </FormControl>
    </div>
  );
};
