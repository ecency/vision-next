import { Button } from "@ui/button";
import React, { useCallback, useMemo } from "react";
import i18next from "i18next";
import { shareVariantSvg } from "@ui/svg";
import { Tsx } from "@/features/i18n/helper";
import { success } from "@/features/shared";
import { Account } from "@/entities";
import { getReferralsStatsQuery } from "@/api/queries";
import { Badge } from "@ui/badge";

interface Props {
  account: Account;
}

export function ProfileReferralHeader({ account }: Props) {
  const { data: stats } = getReferralsStatsQuery(account.name).useClientQuery();

  const { earnedPoints, unearnedPoints } = useMemo(() => {
    const earnedPoints = (stats?.rewarded ?? 0) * 100;
    const unearnedPoints = ((stats?.total ?? 0) - (stats?.rewarded ?? 0)) * 100;
    return {
      earnedPoints,
      unearnedPoints
    };
  }, [stats?.rewarded, stats?.total]);

  const copyToClipboard = useCallback((text: string) => {
    const textField = document.createElement("textarea");
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
    success(i18next.t("profile-edit.copied"));
  }, []);

  return (
    <div className="my-4 flex flex-col items-start">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-2xl font-bold">{i18next.t("referral.page-title")}</div>
        <Button
          size="sm"
          icon={shareVariantSvg}
          onClick={() => copyToClipboard(`https://ecency.com/signup?referral=${account.name}`)}
        >
          {i18next.t("entry.address-copy")}
        </Button>
      </div>

      <div className="grid w-full sm:w-auto sm:grid-cols-2 gap-4 my-4">
        <div className="w-full sm:min-w-[240px] border border-[--border-color] rounded-2xl p-4">
          <div className="font-semibold mb-2">{i18next.t("referral.earned-reward")}</div>
          <Badge className="!text-lg">{earnedPoints}</Badge>
        </div>
        <div className="w-full sm:min-w-[240px] border border-[--border-color] rounded-2xl p-4">
          <div className="font-semibold mb-2">{i18next.t("referral.pending-reward")}</div>
          <Badge className="!text-lg">{unearnedPoints}</Badge>
        </div>
      </div>
      <Tsx k="referral.page-description-long">
        <div className="mt-4" />
      </Tsx>
    </div>
  );
}
