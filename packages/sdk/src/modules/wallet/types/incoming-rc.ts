export interface IncomingRcDelegation {
  sender: string;
  amount: string;
}

export interface IncomingRcResponse {
  list: IncomingRcDelegation[];
}
