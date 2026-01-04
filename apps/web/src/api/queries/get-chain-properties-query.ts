import { getChainPropertiesQueryOptions } from "@ecency/sdk";
import { parseAsset } from "@/utils";
import numeral from "numeral";

export const getChainPropertiesQuery = () => {
  const sdkQuery = getChainPropertiesQueryOptions();

  return {
    ...sdkQuery,
    // Transform SDK data to app-specific format
    select: (data: any) => {
      const asset = parseAsset(data.account_creation_fee.toString());
      return `${numeral(asset.amount).format("0.000")} ${asset.symbol}`;
    },
  };
};
