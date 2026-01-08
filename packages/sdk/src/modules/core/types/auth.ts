import type { Operation } from "@hiveio/dhive";

export interface AuthContext {
  accessToken?: string;
  postingKey?: string | null;
  loginType?: string | null;
  broadcast?: (
    operations: Operation[],
    authority?: "active" | "posting" | "owner" | "memo"
  ) => Promise<unknown>;
}
