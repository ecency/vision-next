import { InstanceConfigManager } from "@/core";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export function BlogSidebar() {
  const { data } = useQuery(
    getAccountFullQueryOptions(
      InstanceConfigManager.getConfigValue(
        ({ configuration }) => configuration.instanceConfiguration.username
      )
    )
  );

  return <div>{data?.name}</div>;
}
