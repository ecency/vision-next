"use client";

import { getAccountWalletListQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export function ProfileWalletTokensList() {
  const { username } = useParams();
  const { data } = useQuery(
    getAccountWalletListQueryOptions((username as string).replace("%40", ""))
  );

  console.log(data);

  return <div>test</div>;
}
