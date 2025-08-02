import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import { useState } from "react";
import { WalletOperationCard } from "./wallet-opearation-card";

interface Props {
  asset: string;
  username: string;
}

export function WalletOperationsTransfer({ asset, username }: Props) {
  const [to, setTo] = useState("");

  return (
    <div className="grid grid-cols-[1fr_max-content_1fr] items-center gap-4">
      <WalletOperationCard asset={asset} username={username} />
      <UilArrowRight />
      <WalletOperationCard asset={asset} username={to} onUsernameSubmit={(v) => setTo(v)} />
    </div>
  );
}
