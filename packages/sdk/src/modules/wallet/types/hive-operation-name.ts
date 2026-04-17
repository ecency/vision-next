import { utils } from "../../../hive-tx";
import type { HiveOperationGroup } from "./hive-operation-group";

/**
 * All operation names (including virtual operations) extracted from hive-tx utils.
 * In hive-tx, utils.operations includes both real and virtual operations,
 * so there is no separate VirtualOperationName type.
 */
export type HiveOperationName = keyof typeof utils.operations;

export type HiveOperationFilterValue = HiveOperationGroup | HiveOperationName;
export type HiveOperationFilter =
  | HiveOperationFilterValue
  | HiveOperationFilterValue[];

export type HiveOperationFilterKey = string;
