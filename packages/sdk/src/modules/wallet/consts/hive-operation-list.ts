import { utils } from "@hiveio/dhive";
import type { HiveOperationName } from "../types";

export const HIVE_OPERATION_LIST = Object.keys(
  utils.operationOrders
) as HiveOperationName[];
