import i18next from "i18next";
import { SuggestionList, UserAvatar } from "@/features/shared";
import { FormControl, InputGroup } from "@ui/input";
import { TransferFormText } from "@/features/shared/transfer/transfer-form-text";
import React, { useContext, useMemo } from "react";
import { TransferSharedStateContext } from "@/features/shared/transfer/transfer-shared-state";
import { getTransactionsQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";

interface Props {
  toWarning: string | undefined;
  toError: Error | null;
}

export function TransferStep1To({ toWarning, toError }: Props) {
  const { setTo, to, exchangeWarning } = useContext(TransferSharedStateContext);

  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data: transactions } = getTransactionsQuery(activeUser?.username).useClientQuery();
  const transactionsFlow = useMemo(
    () => transactions?.pages.reduce((acc, page) => [...acc, ...page], []) ?? [],
    [transactions]
  );

  const recent = useMemo(
    () =>
      Array.from(
        new Set(
          transactionsFlow
            .filter(
              (x) =>
                (x.type === "transfer" && x.from === activeUser?.username) ||
                (x.type === "delegate_vesting_shares" && x.delegator === activeUser?.username)
            )
            .map((x) =>
              x.type === "transfer" ? x.to : x.type === "delegate_vesting_shares" ? x.delegatee : ""
            )
            .filter((x) => {
              if (to!.trim() === "") {
                return true;
              }

              return x.indexOf(to!) !== -1;
            })
            .reverse()
            .slice(0, 5)
        ) ?? []
      ),
    [activeUser?.username, to, transactionsFlow]
  );

  return (
    <>
      <div className="grid items-center grid-cols-12 mb-4">
        <div className="col-span-12 sm:col-span-2">
          <label>{i18next.t("transfer.to")}</label>
        </div>
        <div className="col-span-12 sm:col-span-10">
          <SuggestionList
            onSelect={(to: string) => setTo(to)}
            items={recent}
            renderer={(i) => (
              <>
                <UserAvatar username={i} size="medium" />
                <span style={{ marginLeft: "4px" }}>{i}</span>
              </>
            )}
            header={i18next.t("transfer.recent-transfers")}
          >
            <InputGroup prepend="@">
              <FormControl
                type="text"
                autoFocus={to === ""}
                placeholder={i18next.t("transfer.to-placeholder")}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={toError ? "is-invalid" : ""}
              />
            </InputGroup>
          </SuggestionList>
        </div>
      </div>
      {toWarning && <TransferFormText msg={toWarning} type="danger" />}
      {toError && <TransferFormText msg={i18next.t("transfer.to-not-found")} type="danger" />}
      {exchangeWarning && <TransferFormText msg={exchangeWarning} type="danger" />}
    </>
  );
}
