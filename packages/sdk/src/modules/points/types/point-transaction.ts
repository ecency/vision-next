export interface PointTransaction {
  id: number;
  type: number;
  created: string;
  memo: string | null;
  amount: string;
  sender: string | null;
  receiver: string | null;
}

export interface Points {
  points: string;
  uPoints: string;
  transactions: PointTransaction[];
}
