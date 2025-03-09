import { Account } from "./accounts";

export interface UserKeys {
  owner?: string;
  active?: string;
  posting?: string;
  memo?: string;
}

export interface User {
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  postingKey: null | undefined | string;
  index?: number; // index in a list
}

export interface UserPoints {
  points: string;
  uPoints: string;
}

export interface ActiveUser {
  username: string;
  data: Account;
}
