import type { Operation } from "@hiveio/dhive";

export interface AuthContext {
  accessToken?: string;
  postingKey?: string | null;
  loginType?: string | null;
  broadcast?: (
    operations: Operation[],
    auth: AuthContext,
    authority?: "Active" | "Posting" | "Owner" | "Memo"
  ) => Promise<unknown>;
}
