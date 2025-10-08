export interface GetGameStatus {
  key: string;
  remaining: number;
  status: number;
  next_date: string; // ISO String
  wait_secs: number;
}
