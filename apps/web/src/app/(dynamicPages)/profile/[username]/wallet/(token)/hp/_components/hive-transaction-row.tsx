import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery } from "@/api/queries";
import { cashCoinSvg, pickAxeSvg, powerDownSvg, powerUpSvg, ticketSvg } from "@/assets/img/svg";
import { Transaction } from "@/entities";
import { Tsx } from "@/features/i18n/helper";
import { EntryLink, ProfileLink, UserAvatar } from "@/features/shared";
import { TwoUserAvatar } from "@/features/shared/two-user-avatar";
import { formattedNumber, parseAsset, vestsToHp } from "@/utils";
import { UilArrowRight, UilRefresh } from "@tooni/iconscout-unicons-react";
import { useMemo } from "react";
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
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  const { hivePerMVests } = useMemo(() => dynamicProps ?? DEFAULT_DYNAMIC_PROPS, [dynamicProps]);

  let flag = true;
  let icon = ticketSvg;
  let numbers = null;
  let details = null;

  if (tr.type === "curation_reward") {
    icon = cashCoinSvg;

    numbers = (
      <>
        {formattedNumber(vestsToHp(parseAsset(tr.reward).amount, hivePerMVests), {
          suffix: "HP"
        })}
      </>
    );
    details = (
      <EntryLink
        entry={{
          category: "history",
          author: tr.comment_author || tr.author || "",
          permlink: tr.comment_permlink || tr.permlink || ""
        }}
      >
        <span>
          {"@"}
          {tr.comment_author || tr.author}/{tr.comment_permlink || tr.permlink}
        </span>
      </EntryLink>
    );
  } else if (tr.type === "author_reward" || tr.type === "comment_benefactor_reward") {
    icon = cashCoinSvg;

    const vesting_payout = parseAsset(tr.vesting_payout);
    numbers = (
      <>
        {vesting_payout.amount > 0 && (
          <span className="number">
            {formattedNumber(vestsToHp(vesting_payout.amount, hivePerMVests), { suffix: "HP" })}{" "}
          </span>
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
  } else if (tr.type === "claim_reward_balance") {
    const reward_vests = parseAsset(tr.reward_vests);

    numbers = (
      <>
        {reward_vests.amount > 0 && (
          <span className="number">
            {formattedNumber(vestsToHp(reward_vests.amount, hivePerMVests), { suffix: "HP" })}
          </span>
        )}
      </>
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
  } else if (tr.type === "set_withdraw_vesting_route") {
    icon = <TwoUserAvatar from={tr.from_account} to={tr.to_account} size="small" />;

    details = (
      <div className="space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {"Auto Vest:"} {tr.auto_vest}
          <br />
          {"Percent:"} {tr.percent}
        </div>
        <TransferParticipants from={tr.from_account} to={tr.to_account} />
      </div>
    );

    numbers = <span className="number">{tr.percent}</span>;
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
  } else if (tr.type === "withdraw_vesting") {
    icon = powerDownSvg;

    const vesting_shares = parseAsset(tr.vesting_shares);
    numbers = (
      <span className="number">
        {formattedNumber(vestsToHp(vesting_shares.amount, hivePerMVests), { suffix: "HP" })}
      </span>
    );

    details = tr.acc ? (
      <span>
        <strong>@{tr.acc}</strong>
      </span>
    ) : null;
  } else if (tr.type === "delegate_vesting_shares") {
    icon = <TwoUserAvatar from={tr.delegator} to={tr.delegatee} size="small" />;

    const vesting_shares = parseAsset(tr.vesting_shares);
    numbers = (
      <span className="number">
        {formattedNumber(vestsToHp(vesting_shares.amount, hivePerMVests), { suffix: "HP" })}
      </span>
    );

    details = tr.delegatee ? (
      <TransferParticipants from={tr.delegator} to={tr.delegatee} />
    ) : null;
  } else if (tr.type === "fill_vesting_withdraw") {
    icon = powerDownSvg;

    numbers = <span className="number">{tr.deposited}</span>;

    details = tr.from_account ? (
      <TransferParticipants from={tr.from_account} to={tr.to_account} />
    ) : null;
  } else if (tr.type === "producer_reward") {
    icon = pickAxeSvg;

    numbers = (
      <>
        {formattedNumber(vestsToHp(parseAsset(tr.vesting_shares).amount, hivePerMVests), {
          suffix: "HP"
        })}
      </>
    );
  } else if (tr.type === "return_vesting_delegation") {
    icon = powerUpSvg;

    numbers = (
      <>
        {formattedNumber(vestsToHp(parseAsset(tr.vesting_shares).amount, hivePerMVests), {
          suffix: "HP"
        })}
      </>
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
