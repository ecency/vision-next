import { EcencyQueriesManager } from "@/core/react-query";
import { ActiveUser } from "@/entities";
import { getMutedUsersQueryOptions } from "@ecency/sdk";

export const getMutedUsersQuery = (activeUser: ActiveUser | null, limit = 100) =>
  EcencyQueriesManager.generateClientServerQuery(
    getMutedUsersQueryOptions(activeUser?.username, limit)
  );
