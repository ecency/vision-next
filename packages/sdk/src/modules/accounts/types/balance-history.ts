export type BalanceCoinType = "HIVE" | "HBD" | "VESTS";

export interface BalanceHistoryEntry {
  block_num: number;
  operation_id: string;
  op_type_id: number;
  balance: string;
  prev_balance: string;
  balance_change: string;
  timestamp: string;
}

export interface BalanceHistoryResponse {
  total_operations: number;
  total_pages: number;
  operations_result: BalanceHistoryEntry[];
}

export interface AggregatedBalanceEntry {
  date: string;
  balance: {
    balance: string;
    savings_balance: string;
  };
  prev_balance: {
    balance: string;
    savings_balance: string;
  };
  min_balance: {
    balance: string;
    savings_balance: string;
  };
  max_balance: {
    balance: string;
    savings_balance: string;
  };
}
