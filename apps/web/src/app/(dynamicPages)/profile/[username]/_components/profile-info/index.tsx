import React, { useMemo } from "react";
import dayjs from "@/utils/dayjs";
import { RCAccount } from "@hiveio/dhive/lib/chain/rc";
import "./_index.scss";
import { Account, FullAccount } from "@/entities";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery } from "@/api/queries";
import { downVotingPower, powerRechargeTime, rcPower, votingPower, votingValue } from "@/api/hive";
import { formattedNumber } from "@/utils";
import i18next from "i18next";
import { hiveSvg } from "@ui/svg";
import { StyledTooltip } from "@ui/tooltip";
import { Spinner } from "@ui/spinner";
import { UilInfo, UilInfoCircle } from "@tooni/iconscout-unicons-react";
import { useQuery } from "@tanstack/react-query";
import { getAccountRcQueryOptions } from "@ecency/sdk";
import { Button } from "@/features/ui";

interface ContentProps {
  account: FullAccount;
  rcAccount?: RCAccount;
}

function ProfileInfoContent({ account, rcAccount }: ContentProps) {
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  // Voting power
  const vPower = votingPower(account);
  const vPowerFixed = vPower.toFixed(2);
  const vPowerRecharge = powerRechargeTime(vPower);
  const vPowerRechargeDate = dayjs().add(vPowerRecharge, "second");

  // Voting value
  const vValue = votingValue(account, dynamicProps ?? DEFAULT_DYNAMIC_PROPS, vPower * 100).toFixed(
    3
  );
  const vValueFull = votingValue(account, dynamicProps ?? DEFAULT_DYNAMIC_PROPS, 10000).toFixed(3);

  // Join date
  const created = dayjs.utc(account.created).format("LL");

  // Last active
  const lastVoteDate = dayjs.utc(account.last_vote_time);
  const lastPostDate = dayjs.utc(account.last_post);
  const createdDate = dayjs.utc(account.created);
  const lastActive = dayjs.max(lastVoteDate, lastPostDate, createdDate);

  // Down vote power
  const dvPower = downVotingPower(account);

  const rcInfo = useMemo(() => {
    if (!rcAccount) {
      return null;
    }

    const rcp = rcPower(rcAccount);
    const rcpFixed = rcp.toFixed(2);
    const rcpRecharge = powerRechargeTime(rcp);
    const rcpRechargeDate = dayjs().add(rcpRecharge, "second");

    return {
      rcpFixed,
      rcpRechargeDate,
    };
  }, [rcAccount]);

  return (
    <div className="profile-info-tooltip-content [&>p]:mb-0 text-sm">
      <p>{i18next.t("profile-info.joined", { n: created })}</p>
      <p>
        {i18next.t("profile-info.post-count", {
          n: formattedNumber(account.post_count!, { fractionDigits: 0 })
        })}
      </p>
      <p>{i18next.t("profile-info.last-active", { n: lastActive.fromNow() })}</p>
      <p>
        {i18next.t("profile-info.vote-value", { n: vValue })}
        {hiveSvg}
        {vValue !== vValueFull && (
          <small>{i18next.t("profile-info.vote-value-max", { n: vValueFull })}</small>
        )}
      </p>
      <p>
        {i18next.t("profile-info.vote-power", { n: vPowerFixed })}
        {vPowerFixed !== "100.00" && (
          <small>
            {i18next.t("profile-info.recharge-time", { n: vPowerRechargeDate.fromNow() })}
          </small>
        )}
      </p>
      <p>{i18next.t("profile-info.down-vote-power", { n: dvPower.toFixed(2) })}</p>
      {rcInfo && (
        <p>
          {i18next.t("profile-info.rc-power", { n: rcInfo.rcpFixed })}
          {rcInfo.rcpFixed !== "100.00" && (
            <small>{i18next.t("profile-info.recharge-time", { n: rcInfo.rcpRechargeDate.fromNow() })}</small>
          )}
        </p>
      )}
    </div>
  );
}

interface Props {
  account: Account;
}

export function ProfileInfo({ account }: Props) {
  const { data, isLoading: isRcLoading } = useQuery(getAccountRcQueryOptions(account.name));
  const rcAccount = useMemo(() => data?.[0], [data]);
  const isLoaded = Boolean(account?.__loaded) && !isRcLoading;

  return (
    <StyledTooltip
      content={isLoaded ? <ProfileInfoContent account={account} rcAccount={rcAccount} /> : <></>}
    >
      <Button
        isLoading={!isLoaded}
        icon={<UilInfoCircle width={20} height={20} />}
        size="xs"
        appearance="gray"
      />
    </StyledTooltip>
  );
}
