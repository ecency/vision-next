import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGetTokenLogoImage } from "../hooks";

interface WalletOperationCardWrapperProps {
  label: string;
  asset: string;
  balance?: number;
  onBalanceClick?: (value: number) => void;
  userContent?: ReactNode;
  formContent?: ReactNode;
  username: string;
}

export function WalletOperationCardWrapper({
  label,
  asset,
  username,
  balance,
  onBalanceClick,
  userContent,
  formContent
}: WalletOperationCardWrapperProps) {
  const logo = useGetTokenLogoImage(username, asset);

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
          {balance !== undefined && Number.isFinite(balance) && (
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-black dark:text-white font-semibold cursor-pointer hover:text-blue-dark-sky dark:hover:text-blue-dark-sky"
              onClick={() => onBalanceClick?.(+balance)}
            >
              {balance}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {userContent}
      {formContent}
    </div>
  );
}
