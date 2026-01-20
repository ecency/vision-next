export interface RecurrentTransfer {
  id: number;
  from: string;
  to: string;
  amount: string;
  memo: string;
  recurrence: number;
  remaining_executions: number;
  consecutive_failures: number;
  pair_id: number;
}
