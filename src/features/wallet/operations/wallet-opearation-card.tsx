import { UserAvatar } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { UilEditAlt } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useGetTokenLogoImage } from "../hooks";
import { WalletOperationCardUsernameForm } from "./wallet-operation-card-username-form";

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
  const logo = useGetTokenLogoImage(username, asset);

  const { data, isFetching } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));

  return (
    <div className="first:border-b md:first:border-b-0 md:first:border-r border-[--border-color] flex flex-col py-4 gap-4 font-mono">
      <div className="uppercase text-xs px-4 font-semibold text-gray-600 dark:text-gray-400">
        {label}
      </div>
      <div className="flex items-center justify-between gap-2 px-4 h-[36px]">
        <div className="flex items-center gap-2 grayscale">
          {logo}
          <div className="uppercase text-sm font-semibold text-gray-600 dark:text-gray-400">
            {asset}
          </div>
        </div>

        <AnimatePresence>
          {+(data?.accountBalance ?? "0") && (
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-black dark:text-white font-semibold cursor-pointer hover:text-blue-dark-sky dark:hover:text-blue-dark-sky"
              onClick={() => onBalanceClick?.(+(data?.accountBalance ?? "0"))}
            >
              {data?.accountBalance}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-b border-[--border-color]" />

      {username && (
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
      )}
      {!username && <WalletOperationCardUsernameForm onUsernameSubmit={onUsernameSubmit} />}
    </div>
  );
}
