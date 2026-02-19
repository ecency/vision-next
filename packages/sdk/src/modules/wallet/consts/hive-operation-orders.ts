import { utils } from "@hiveio/dhive";
import type { HiveOperationName } from "../types";

const operationOrders = utils.operationOrders as Record<
  HiveOperationName,
  number
>;

export const HIVE_OPERATION_ORDERS = operationOrders;

export const HIVE_OPERATION_NAME_BY_ID: Record<number, HiveOperationName> =
  Object.entries(operationOrders).reduce((acc, [name, id]) => {
    acc[id] = name as HiveOperationName;
    return acc;
  }, {} as Record<number, HiveOperationName>);
