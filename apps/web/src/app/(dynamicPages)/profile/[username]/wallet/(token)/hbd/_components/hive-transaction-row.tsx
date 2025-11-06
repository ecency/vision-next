import { cashCoinSvg, ticketSvg } from "@/assets/img/svg";
import { Transaction } from "@/entities";
import { Tsx } from "@/features/i18n/helper";
import { EntryLink, ProfileLink, UserAvatar } from "@/features/shared";
import { formattedNumber, parseAsset } from "@/utils";
import { UilArrowRight, UilRefresh } from "@tooni/iconscout-unicons-react";
import { ProfileWalletTokenHistoryHiveItem } from "../../_components";
import { Badge } from "@/features/ui";

interface Props {
  transaction: Transaction;
  entry?: Transaction;
  onMounted?: () => void;
}

function ParticipantBadge({ username }: { username: string }) {
  return (
    <ProfileLink username={username} className="max-w-full">
      <Badge className="flex max-w-full items-center gap-1 pl-0.5 pr-1 text-left text-sm leading-tight break-all">
        <UserAvatar username={username} size="small" />
        <span className="break-all">{username}</span>
      </Badge>
    </ProfileLink>
  );
}

function TransferParticipants({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <ParticipantBadge username={from} />
      <UilArrowRight className="shrink-0 text-gray-400 dark:text-gray-600" />
      <ParticipantBadge username={to} />
    </div>
  );
}

export function HiveTransactionRow({ entry, transaction: tr }: Props) {
  let flag = true;
  let icon = ticketSvg;
  let numbers = null;
  let details = null;

  if (tr.type === "author_reward" || tr.type === "comment_benefactor_reward") {
    icon = cashCoinSvg;
    const hbd_payout = parseAsset(tr.hbd_payout);
    numbers = hbd_payout.amount > 0 && (
      <span className="number">{formattedNumber(hbd_payout.amount, { suffix: "HBD" })}</span>
    );

    details = (
      <EntryLink
        entry={{
          category: "history",
          author: tr.author,
          permlink: tr.permlink
        }}
      >
        <span>
          {"@"}
          {tr.author}/{tr.permlink}
        </span>
      </EntryLink>
    );
  } else if (tr.type === "claim_reward_balance") {
    const reward_hbd = parseAsset(tr.reward_hbd);

    numbers = reward_hbd.amount > 0 && (
      <span className="number">{formattedNumber(reward_hbd.amount, { suffix: "HBD" })}</span>
    );
  } else if (
    tr.type === "transfer" ||
    tr.type === "transfer_to_vesting" ||
    tr.type === "transfer_to_savings"
  ) {
    icon = <UilArrowRight className="w-4 h-4" />;

    details = (
      <div className="space-y-2">
        <TransferParticipants from={tr.from} to={tr.to} />
        {tr.memo ? (
          <div className="text-sm text-gray-600 dark:text-gray-400 break-words">{tr.memo}</div>
        ) : null}
      </div>
    );

    numbers = <span className="number">{tr.amount}</span>;
  } else if (tr.type === "recurrent_transfer" || tr.type === "fill_recurrent_transfer") {
    icon = <UilRefresh className="w-4 h-4" />;

    const recurrentDescription =
      tr.type === "recurrent_transfer" ? (
        <Tsx
          k="transactions.type-recurrent_transfer-detail"
          args={{ executions: tr.executions, recurrence: tr.recurrence }}
        >
          <span className="block" />
        </Tsx>
      ) : (
        <Tsx
          k="transactions.type-fill_recurrent_transfer-detail"
          args={{ remaining_executions: tr.remaining_executions }}
        >
          <span className="block" />
        </Tsx>
      );

    details = (
      <div className="space-y-2">
        {tr.memo ? (
          <div className="text-sm text-gray-600 dark:text-gray-400 break-words">{tr.memo}</div>
        ) : null}
        <div className="text-sm text-gray-600 dark:text-gray-400">{recurrentDescription}</div>
        <TransferParticipants from={tr.from} to={tr.to} />
      </div>
    );
    let aam = tr.amount as any;
    if (tr.type === "fill_recurrent_transfer") {
      const t = parseAsset(tr.amount);
      aam = `${t.amount} ${t.symbol}`;
    }
    numbers = <span className="number">{aam}</span>;
  } else if (tr.type === "comment_reward") {
    icon = cashCoinSvg;

    const payout = parseAsset(tr.payout);

    numbers = (
      <>
        {payout.amount > 0 && (
          <span className="number">{formattedNumber(payout.amount, { suffix: "HBD" })}</span>
        )}
      </>
    );

    details = (
      <EntryLink
        entry={{
          category: "history",
          author: tr.author,
          permlink: tr.permlink
        }}
      >
        <span>
          {"@"}
          {tr.author}/{tr.permlink}
        </span>
      </EntryLink>
    );
  } else if (tr.type === "effective_comment_vote") {
    const payout = parseAsset(tr.pending_payout);

    numbers = (
      <>
        {payout.amount > 0 && (
          <span className="number">{formattedNumber(payout.amount, { suffix: "HBD" })}</span>
        )}
      </>
    );

    details = (
      <EntryLink
        entry={{
          category: "history",
          author: tr.author,
          permlink: tr.permlink
        }}
      >
        <span>
          {"@"}
          {tr.author}/{tr.permlink}
        </span>
      </EntryLink>
    );
  } else {
    flag = false;
  }

  if (flag) {
    return (
      <ProfileWalletTokenHistoryHiveItem
        icon={icon}
        type={tr.type}
        timestamp={tr.timestamp}
        numbers={numbers}
        rawDetails={tr}
      >
        {details}
      </ProfileWalletTokenHistoryHiveItem>
    );
  }

  return (
    <ProfileWalletTokenHistoryHiveItem
      icon={icon}
      type={tr.type}
      timestamp={tr.timestamp}
      numbers={numbers}
      rawDetails={tr}
    >
      <code>{JSON.stringify(tr)}</code>
    </ProfileWalletTokenHistoryHiveItem>
  );
}
