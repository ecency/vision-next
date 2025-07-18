"use client";

import { getPointsAssetTransactionsQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ProfileWalletTokenHistory } from "../_components";

export default function TokenPage() {
  const { username } = useParams();

  const { data } = useQuery(
    getPointsAssetTransactionsQueryOptions((username as string).replace("%40", ""))
  );
  return <ProfileWalletTokenHistory data={data ?? []} />;
}
