import { GeneralAssetTransaction } from "@ecency/wallets";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { TRANSACTIONS_ICONS, TRANSACTIONS_LABELS } from "../_consts";
import { ProfileWalletTokenHistoryCard } from "./profile-wallet-token-history-card";
import { ReactNode } from "react";

interface Props {
  data: GeneralAssetTransaction[];
  action: ReactNode;
}

export function ProfileWalletTokenHistory({ data, action }: Props) {
  return (
    <ProfileWalletTokenHistoryCard action={action}>
      {data.map(({ created, type, results }) => (
        <motion.div
          className="flex items-start justify-between gap-4 px-4 py-2 md:py-4 border-b border-[--border-color] last:border-0"
          key={created.getTime()}
        >
          <div className="flex items-start gap-4 leading-[1]">
            <div className="text-blue-dark-sky bg-blue-duck-egg dark:bg-blue-dark-grey flex items-center justify-center p-2 rounded-lg">
              {TRANSACTIONS_ICONS[type]}
            </div>
            <div>
              <div>{TRANSACTIONS_LABELS[type]()}</div>
              <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                {format(created, "dd.MM.yyyy hh:mm")}
              </div>
            </div>
          </div>

          <div>
            {results.map(({ amount }, i) => (
              <div className="text-blue-dark-sky" key={i}>
                {isNaN(+amount) ? amount : (+amount).toFixed(3)}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </ProfileWalletTokenHistoryCard>
  );
}
