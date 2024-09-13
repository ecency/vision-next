import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";

export const getRcOperatorsStatsQuery = () =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.RC_OPERATORS],
    queryFn: () => client.call("rc_api", "get_rc_stats", {})
  });
