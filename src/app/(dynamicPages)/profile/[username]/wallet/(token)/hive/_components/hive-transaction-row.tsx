import {
  cashCoinSvg,
  cashMultiple,
  chevronDownSvgForSlider,
  chevronUpSvgForVote,
  closeSvg,
  exchangeSvg,
  reOrderHorizontalSvg,
  ticketSvg
} from "@/assets/img/svg";
import { Transaction } from "@/entities";
import { Tsx } from "@/features/i18n/helper";
import { EntryLink, ProfileLink, UserAvatar } from "@/features/shared";
import { TwoUserAvatar } from "@/features/shared/two-user-avatar";
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

  if (tr.type === "claim_reward_balance") {
    const reward_hive = parseAsset(tr.reward_hive);

    numbers = (
      <>
        {reward_hive.amount > 0 && (
          <span className="number">{formattedNumber(reward_hive.amount, { suffix: "HIVE" })}</span>
        )}
      </>
    );
  } else if (tr.type === "author_reward" || tr.type === "comment_benefactor_reward") {
    icon = cashCoinSvg;
    const hive_payout = parseAsset(tr.hive_payout);
    numbers = (
      <>
        {hive_payout.amount > 0 && (
          <span className="number">{formattedNumber(hive_payout.amount, { suffix: "HIVE" })}</span>
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
  } else if (
    tr.type === "transfer" ||
    tr.type === "transfer_to_vesting" ||
    tr.type === "transfer_to_savings"
  ) {
    flag = true;
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
    flag = true;
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
            <div className="flex gap-2 items-center mt-4">
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
          </>
        ) : (
          <>
            <Tsx
              k="transactions.type-fill_recurrent_transfer-detail"
              args={{ remaining_executions: tr.remaining_executions }}
            >
              <span />
            </Tsx>
            <div className="flex gap-2 items-center mt-4">
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
  } else if (tr.type === "cancel_transfer_from_savings") {
    icon = closeSvg;

    details = (
      <Tsx
        k="transactions.type-cancel_transfer_from_savings-detail"
        args={{ from: tr.from, request: tr.request_id }}
      >
        <span />
      </Tsx>
    );
  } else if (tr.type === "fill_order") {
    icon = reOrderHorizontalSvg;

    numbers = (
      <span className="number">
        {tr.current_pays} = {tr.open_pays}
      </span>
    );
  } else if (tr.type === "limit_order_create") {
    icon = reOrderHorizontalSvg;

    numbers = (
      <span className="number">
        {tr.amount_to_sell} = {tr.min_to_receive}
      </span>
    );
  } else if (tr.type === "limit_order_cancel") {
    icon = reOrderHorizontalSvg;

    numbers = <span className="number">{tr.num}</span>;
    details = tr.owner ? (
      <span>
        <strong>Order ID: {tr.orderid}</strong>
      </span>
    ) : null;
  } else if (tr.type === "interest") {
    icon = cashMultiple;

    numbers = <span className="number">{tr.interest}</span>;
  } else if (tr.type === "fill_convert_request") {
    icon = reOrderHorizontalSvg;

    numbers = (
      <span className="number">
        {tr.amount_in} = {tr.amount_out}
      </span>
    );
  } else if (tr.type === "fill_collateralized_convert_request") {
    icon = reOrderHorizontalSvg;

    numbers = (
      <span className="number">
        {tr.amount_in} = {tr.amount_out}
      </span>
    );
    details = (
      <Tsx
        k="transactions.type-fill_collateralized_convert-detail"
        args={{ request: tr.requestid, returned: tr.excess_collateral }}
      >
        <span />
      </Tsx>
    );
  } else if (tr.type === "proposal_pay") {
    icon = ticketSvg;

    numbers = <span className="number">{tr.payment}</span>;
  } else if (tr.type === "update_proposal_votes") {
    icon = tr.approve ? chevronUpSvgForVote : chevronDownSvgForSlider;

    details = (
      <Tsx k="transactions.type-update_proposal_vote-detail" args={{ pid: tr.proposal_ids }}>
        <span />
      </Tsx>
    );
  } else if (tr.type === "collateralized_convert") {
    icon = exchangeSvg;
    const amount = parseAsset(tr.amount);

    numbers = (
      <>
        {amount.amount > 0 && (
          <span className="number">{formattedNumber(amount.amount, { suffix: "HIVE" })}</span>
        )}
      </>
    );

    details = (
      <Tsx k="transactions.type-collateralized_convert-detail" args={{ request: tr.requestid }}>
        <span />
      </Tsx>
    );
  } else if (tr.type === "account_witness_proxy") {
    icon = tr.proxy ? (
      <TwoUserAvatar from={tr.account} to={tr.proxy} size="small" />
    ) : (
      <UserAvatar username={tr.account} size="small" />
    );

    details = (
      <span>
        <strong>@{tr.account}</strong> -&gt; <strong>{tr.proxy ? `@${tr.proxy}` : ""}</strong>
      </span>
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
    >
      <code>{JSON.stringify(tr)}</code>
    </ProfileWalletTokenHistoryHiveItem>
  );
}
