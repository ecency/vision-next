"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import React, { useMemo, useState } from "react";
import "./_index.scss";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { Account, Entry } from "@/entities";
import { LoginRequired, Transfer } from "@/features/shared";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { giftOutlineSvg } from "@ui/svg";
import useMount from "react-use/lib/useMount";
import useUnmount from "react-use/lib/useUnmount";
import { EcencyConfigManager } from "@/config";
import { PostTipsResponse } from "@/api/queries/get-post-tips-query";
import { Popover, PopoverContent } from "@/features/ui";
import { formattedNumber } from "@/utils";

interface Props {
  entry: Entry;
  account?: Account;
  setTipDialogMounted?: (d: boolean) => void;
  handleClickAway?: () => void;
  postTips?: PostTipsResponse;
}

export function EntryTipBtn({
  entry,
  setTipDialogMounted,
  handleClickAway,
  account,
  postTips
}: Props) {
  const { activeUser } = useActiveAccount();

  const [dialog, setDialog] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  const to = useMemo(() => entry.author, [entry]);
  const memo = useMemo(() => `Tip for @${entry.author}/${entry.permlink}`, [entry]);
  const tipCount = postTips?.meta.count ?? 0;
  const tipTotals = Object.entries(postTips?.meta.totals ?? {});
  const tipCountLabel =
    tipCount === 1
      ? i18next.t("entry-tip.count", { count: tipCount })
      : i18next.t("entry-tip.count_plural", { count: tipCount });

  useMount(() => setTipDialogMounted?.(true));
  useUnmount(() => setTipDialogMounted?.(false));

  const openTransferDialog = () => {
    setShowPopover(false);
    setDialog(true);
  };

  const tipButton = (
    <div
      className="entry-tip-btn"
      onClick={() => {
        if (tipCount > 0) {
          setShowPopover((state) => !state);
        } else {
          openTransferDialog();
        }
      }}
    >
      <Tooltip content={i18next.t("entry-tip.title")}>
        <span className="inner-btn">
          {giftOutlineSvg}
          <span className="tip-count">{tipCount > 0 ? tipCount : ""}</span>
        </span>
      </Tooltip>
    </div>
  );

  return (
    <>
      <LoginRequired>
        {tipCount > 0 ? (
          <Popover directContent={tipButton} behavior="click" show={showPopover} setShow={setShowPopover}>
            <PopoverContent>
              <div className="tip-popover">
                <div className="tip-popover-title">
                  {i18next.t("entry-tip.title")}
                  <span className="tip-popover-count">
                    {tipCountLabel}
                  </span>
                </div>
                <div className="tip-popover-grid">
                  {tipTotals.map(([currency, amount]) => (
                    <div className="tip-row" key={currency}>
                      <span className="tip-currency">{currency}</span>
                      <span className="tip-amount">{formattedNumber(amount, { fractionDigits: 3 })}</span>
                    </div>
                  ))}
                </div>
                <button className="tip-action" type="button" onClick={openTransferDialog}>
                  {i18next.t("entry-tip.send-tip")}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          tipButton
        )}
      </LoginRequired>
      {dialog && activeUser && (
        <Modal
          show={true}
          centered={true}
          onHide={() => setDialog(false)}
          className="tipping-dialog"
          size="lg"
        >
          <ModalHeader thin={true} closeButton={true} />
          <ModalBody>
            <Transfer
              asset={EcencyConfigManager.CONFIG.visionFeatures.points.enabled ? "POINT" : "HIVE"}
              mode="transfer"
              amount={
                EcencyConfigManager.CONFIG.visionFeatures.points.enabled ? "100.000" : "1.000"
              }
              to={to}
              memo={memo}
              handleClickAway={handleClickAway}
              account={account}
              onHide={() => setDialog(false)}
            />
          </ModalBody>
        </Modal>
      )}
    </>
  );
}
