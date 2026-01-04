import { ActiveUser } from "@/entities";
import { getMutedUsersQueryOptions } from "@ecency/sdk";

export const getMutedUsersQuery = (activeUser: ActiveUser | null, limit = 100) =>
  getMutedUsersQueryOptions(activeUser?.username, limit);
