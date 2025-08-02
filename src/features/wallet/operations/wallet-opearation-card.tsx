import { useState } from "react";
import { useGetTokenLogoImage } from "../hooks";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { UserAvatar } from "@/features/shared";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { UilEnter } from "@tooni/iconscout-unicons-react";

interface Props {
  asset: string;
  username: string;
  onUsernameSubmit?: (username: string) => void;
}

export function WalletOperationCard({ asset, username, onUsernameSubmit }: Props) {
  const logo = useGetTokenLogoImage(username, asset);

  const [usernameInput, setUsernameInput] = useState("");
  const { data, isFetching } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
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
              className="text-blue-dark-sky font-semibold"
            >
              {data?.accountBalance}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {username && (
        <div className="flex items-center gap-2">
          <UserAvatar username={username} size="medium" />
          <div className="text-lg text-blue-dark-sky py-2">@{username}</div>
        </div>
      )}
      {!username && (
        <InputGroup
          append={
            <Button
              appearance="gray-link"
              icon={<UilEnter />}
              onClick={() => onUsernameSubmit?.(usernameInput)}
            />
          }
        >
          <FormControl
            type="text"
            value={usernameInput}
            placeholder="Username"
            onChange={(e) => setUsernameInput(e.target.value)}
          />
        </InputGroup>
      )}
    </div>
  );
}
