"use client";

import React, { useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { client, powerRechargeTime, rcPower } from "@/api/hive";
import moment, { Moment } from "moment";
import { PurchaseQrDialog } from "../purchase-qr";
import "./index.scss";
import { createPortal } from "react-dom";
import { Button } from "@ui/button";
import { RcOperation } from "@/entities";
import { useMounted } from "@/utils/use-mounted";
import { rcFormatter } from "@/utils";
import i18next from "i18next";
import { getRcAccountsQuery, getRcOperatorsStatsQuery } from "@/api/queries";

interface Props {
  username: string;
  operation: RcOperation;
  className?: string;
}

export const AvailableCredits = ({ username, className }: Props) => {
  const [rcpFixed, setRcpFixed] = useState(0);
  const [rcp, setRcp] = useState(0);
  const [rcpRechargeDate, setRcpRechargeDate] = useState<Moment>(moment());
  const [delegated, setDelegated] = useState("0");
  const [receivedDelegation, setReceivedDelegation] = useState("0");
  const [commentAmount, setCommentAmount] = useState(0);
  const [voteAmount, setVoteAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const [host, setHost] = useState<any>();
  const [popperElement, setPopperElement] = useState<any>();
  const [isShow, setIsShow] = useState(false);

  const { data: rcValues } = getRcAccountsQuery(username).useClientQuery();
  const { data: rcStats } = getRcOperatorsStatsQuery().useClientQuery();

  const popper = usePopper(host, popperElement);

  const isMounted = useMounted();

  useEffect(() => {
    if (!rcValues || !rcStats) {
      return;
    }

    const account = rcValues[0];

    setRcp(client.rc.calculateRCMana(account).current_mana);
    setRcpFixed(Math.floor(+rcPower(account)));
    setRcpRechargeDate(moment().add(powerRechargeTime(rcPower(account)), "seconds"));

    const outGoing = rcValues.map((a: any) => a.delegated_rc);
    const delegated = outGoing[0];
    const formatOutGoing: any = rcFormatter(delegated);
    setDelegated(formatOutGoing);

    const inComing: any = rcValues.map((a: any) => Number(a.received_delegated_rc));
    const formatIncoming = rcFormatter(inComing);
    setReceivedDelegation(formatIncoming);

    const operationCosts = rcStats.rc_stats.ops;
    const commentCost = operationCosts.comment_operation.avg_cost;
    const transferCost = operationCosts.transfer_operation.avg_cost;
    const voteCost = operationCosts.vote_operation.avg_cost;

    const availableResourceCredit: any = rcValues.map((a: any) => a.rc_manabar.current_mana);
    setCommentAmount(Math.ceil(Number(availableResourceCredit[0]) / commentCost));
    setVoteAmount(Math.ceil(Number(availableResourceCredit[0]) / voteCost));
    setTransferAmount(Math.ceil(Number(availableResourceCredit[0]) / transferCost));
  }, [rcStats, rcValues]);

  const show = () => {
    setIsShow(true);
    popper.update?.();
  };

  const hide = () => {
    setIsShow(false);
    popper.update?.();
  };

  return isMounted ? (
    <>
      <div className="available-credits flex items-center justify-between w-full pr-3">
        <div
          ref={setHost}
          className={
            "available-credits-bar w-full " +
            className +
            (rcpFixed <= 10 ? " danger" : rcpFixed <= 25 ? " warning" : "")
          }
          onMouseOver={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
        >
          <div className="available-credits-progress">
            <div
              className={
                "available-credits-indicator " +
                (rcpFixed <= 10 ? "danger" : rcpFixed <= 25 ? "warning" : "")
              }
              style={{ width: `${rcpFixed}%` }}
            />
          </div>
        </div>
        {commentAmount <= 5 ? (
          <Button noPadding={true} appearance="link" onClick={() => setShowPurchaseDialog(true)}>
            {i18next.t("rc-info.boost")}
          </Button>
        ) : (
          <></>
        )}
      </div>
      {createPortal(
        <div
          ref={setPopperElement}
          className={"available-credits-bar-popper " + (isShow ? "show" : "")}
          style={popper.styles.popper}
          {...popper.attributes.popper}
        >
          <div>
            <div className="p-3">
              <span className="opacity-75">{i18next.t("rc-info.resource-credits")}</span>
              <div>
                {rcFormatter(rcp)}({rcpFixed}%)
              </div>
              <div>
                {rcpFixed !== 100 && (
                  <small>
                    {i18next.t("profile-info.recharge-time", { n: rcpRechargeDate.fromNow() })}
                  </small>
                )}
              </div>
            </div>
            <div className="delegations flex flex-col p-3">
              <span className="incoming mb-2">
                <div className="opacity-75">{i18next.t("rc-info.received-delegations")}</div>
                {receivedDelegation}
              </span>
              <span className="outgoing">
                <div className="opacity-75">{i18next.t("rc-info.delegated")}</div>
                {delegated}
              </span>
            </div>
          </div>

          <div className="extra-details p-2">
            <span className="block mb-3 opacity-50">
              {i18next.t("rc-info.extra-details-heading")}
            </span>
            <div className="extras">
              <div className="mb-2">
                <div className="opacity-75">{i18next.t("rc-info.extra-details-post")}</div>
                {commentAmount}
              </div>
              <div className="two-col">
                <div className="mb-2">
                  <div className="opacity-75">{i18next.t("rc-info.extra-details-upvote")}</div>
                  {voteAmount}
                </div>
                <div>
                  <div className="opacity-75">{i18next.t("rc-info.extra-details-transfer")}</div>
                  {transferAmount}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.querySelector("#popper-container")!!
      )}
      <PurchaseQrDialog show={showPurchaseDialog} setShow={(v) => setShowPurchaseDialog(v)} />
    </>
  ) : (
    <></>
  );
};
