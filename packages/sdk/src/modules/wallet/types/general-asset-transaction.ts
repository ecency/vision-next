import { OperationName } from "@hiveio/dhive";

export interface GeneralAssetTransaction {
  id: number | string;
  type: OperationName | number | string;
  created: Date;

  results: {
    amount: string | number;
    asset: string;
  }[];

  from?: string;
  to?: string;
  memo?: string;
}
