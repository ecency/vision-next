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
      <div>
        <div className="flex gap-2 items-center">
          <ProfileLink username={tr.from}>
            <Badge className="flex gap-1 pl-0.5 items-center">
              <UserAvatar username={tr.from} size="small" />
              {tr.from}
            </Badge>
          </ProfileLink>
          <UilArrowRight className="text-gray-400 dark:text-gray-600" />
          <ProfileLink username={tr.to}>
            <Badge className="flex gap-1 pl-0.5 items-center">
              <UserAvatar username={tr.to} size="small" />
              {tr.to}
            </Badge>
          </ProfileLink>
        </div>
        {tr.memo && <div className="text-sm opacity-75">{tr.memo}</div>}
      </div>
    );

    numbers = <span className="number">{tr.amount}</span>;
  } else if (tr.type === "recurrent_transfer" || tr.type === "fill_recurrent_transfer") {
    icon = <UilRefresh className="w-4 h-4" />;

    details = (
      <span>
        {tr.memo ? (
          <>
            {tr.memo} <br /> <br />
          </>
        ) : null}
        {tr.type === "recurrent_transfer" ? (
          <>
            <Tsx
              k="transactions.type-recurrent_transfer-detail"
              args={{ executions: tr.executions, recurrence: tr.recurrence }}
            >
              <span />
            </Tsx>
            <br />
            <br />
            <strong>@{tr.from}</strong> -&gt; <strong>@{tr.to}</strong>
          </>
        ) : (
          <>
            <Tsx
              k="transactions.type-fill_recurrent_transfer-detail"
              args={{ remaining_executions: tr.remaining_executions }}
            >
              <span />
            </Tsx>
            <br />
            <br />
            <strong>@{tr.from}</strong> -&gt; <strong>@{tr.to}</strong>
          </>
        )}
      </span>
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
