import { Account } from "./accounts";

export interface UserKeys {
  owner?: string;
  active?: string;
  posting?: string;
  memo?: string;
}

export type LoginType = "hivesigner" | "keychain" | "privateKey";

export interface User {
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  postingKey: null | undefined | string;
  index?: number; // index in a list
  loginType?: LoginType;
}

export interface UserPoints {
  points: string;
  uPoints: string;
}

export interface ActiveUser {
  username: string;
  data: Account;
}
