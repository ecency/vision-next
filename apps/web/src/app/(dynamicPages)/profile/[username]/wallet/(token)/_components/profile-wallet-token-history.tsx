import { GeneralAssetTransaction, PointTransactionType } from "@ecency/wallets";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { TRANSACTIONS_ICONS, TRANSACTIONS_LABELS } from "../_consts";
import { ProfileWalletTokenHistoryCard } from "./profile-wallet-token-history-card";
import { ReactNode } from "react";
import { Badge } from "@/features/ui";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";

interface Props {
  data: GeneralAssetTransaction[];
  action: ReactNode;
}

export function ProfileWalletTokenHistory({ data, action }: Props) {
  return (
    <ProfileWalletTokenHistoryCard action={action}>
      {data.map((transaction) => {
        const { created, type, results, from, to, id } = transaction;
        const labelFactory = TRANSACTIONS_LABELS[type] ?? (() => "");
        const numericType = Number(type);
        const transferLabel =
          numericType === PointTransactionType.TRANSFER_SENT && to
            ? labelFactory(`@${to}`)
            : numericType === PointTransactionType.TRANSFER_INCOMING && from
              ? labelFactory(`@${from}`)
              : labelFactory();

        const fromUser = from ? (
          <ProfileLink username={from}>
            <Badge className="flex items-center gap-1 pl-0.5">
              <UserAvatar username={from} size="small" />
              {from}
            </Badge>
          </ProfileLink>
        ) : null;

        const toUser = to ? (
          <ProfileLink username={to}>
            <Badge className="flex items-center gap-1 pl-0.5">
              <UserAvatar username={to} size="small" />
              {to}
            </Badge>
          </ProfileLink>
        ) : null;

        const label =
          numericType === PointTransactionType.TRANSFER_INCOMING ||
          numericType === PointTransactionType.TRANSFER_SENT ? (
            <div className="flex flex-col gap-2">
              <div>{transferLabel}</div>
              {(fromUser || toUser) && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {fromUser}
                  {fromUser && toUser ? (
                    <UilArrowRight className="text-gray-400 dark:text-gray-600" />
                  ) : null}
                  {toUser}
                </div>
              )}
              {transaction.memo ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {transaction.memo}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {transferLabel}
              {transaction.memo ? (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {transaction.memo}
                </div>
              ) : null}
            </>
          );

        return (
          <motion.div
            className="flex items-start justify-between gap-4 px-4 py-2 md:py-4 border-b border-[--border-color] last:border-0"
            key={id ?? created.getTime()}
          >
            <div className="flex items-start gap-4 leading-[1]">
              <div className="text-blue-dark-sky bg-blue-duck-egg dark:bg-blue-dark-grey flex items-center justify-center p-2 rounded-lg">
                {TRANSACTIONS_ICONS[type]}
              </div>
              <div>
                <div>{label}</div>
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
        );
      })}
    </ProfileWalletTokenHistoryCard>
  );
}
