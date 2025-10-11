import { UserAvatar } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { UilEditAlt } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import { WalletOperationCardUsernameForm } from "./wallet-operation-card-username-form";
import { WalletOperationCardWrapper } from "./wallet-operation-card-wrapper";

interface Props {
  label: string;
  asset: string;
  username: string;
  editable?: boolean;
  onUsernameSubmit?: (username: string | undefined) => void;
  onBalanceClick?: (value: number) => void;
}

export function WalletOperationCard({
  label,
  asset,
  username,
  onUsernameSubmit,
  editable,
  onBalanceClick
}: Props) {
  const { data, isFetching } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));

  const userContent = username ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-between items-center px-4 h-[44px]"
    >
      <div className="flex items-center gap-2">
        <UserAvatar username={username} size="medium" />
        <div className="text-black dark:text-white py-2">@{username}</div>
      </div>
      {editable && (
        <Button
          noPadding={true}
          icon={<UilEditAlt />}
          appearance="gray-link"
          onClick={() => onUsernameSubmit?.(undefined)}
        />
      )}
    </motion.div>
  ) : null;

  const formContent = !username ? (
    <WalletOperationCardUsernameForm onUsernameSubmit={onUsernameSubmit} />
  ) : null;

  return (
    <WalletOperationCardWrapper
      label={label}
      asset={asset}
      username={username}
      balance={data?.accountBalance}
      onBalanceClick={onBalanceClick}
      userContent={userContent}
      formContent={formContent}
    />
  );
}
