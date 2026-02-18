import type {
  OperationName,
  VirtualOperationName,
} from "@hiveio/dhive";
import type { HiveOperationGroup } from "./hive-operation-group";

export type HiveOperationName = OperationName | VirtualOperationName;

export type HiveOperationFilterValue = HiveOperationGroup | HiveOperationName;
export type HiveOperationFilter =
  | HiveOperationFilterValue
  | HiveOperationFilterValue[];

export type HiveOperationFilterKey = string;
