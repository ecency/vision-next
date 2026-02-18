import { Button, Table, Td, Th, Tooltip, Tr } from "@/features/ui";
import i18next from "i18next";
import { useQuery } from "@tanstack/react-query";
import { getHiveAssetWithdrawalRoutesQueryOptions } from "@ecency/sdk";
import { UilTrashAlt } from "@tooni/iconscout-unicons-react";
import React from "react";
import { WithdrawRoutesFormData } from "./wallet-operation-withdraw-routes-form";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  onDeleteRoute?: (data: WithdrawRoutesFormData) => void;
}

export function WalletOperationWithdrawRoutes({ onDeleteRoute }: Props) {
  const { activeUser } = useActiveAccount();
  const { data: routes } = useQuery(getHiveAssetWithdrawalRoutesQueryOptions(activeUser?.username));

  return (
    <div className="p-4">
      <Table full={true}>
        <thead>
          <Tr>
            <Th className="border p-2">{i18next.t("withdraw-routes.account")}</Th>
            <Th className="border p-2">{i18next.t("withdraw-routes.percent")}</Th>
            <Th className="border p-2">{i18next.t("withdraw-routes.auto-power-up")}</Th>
            <Th className="border p-2" />
          </Tr>
        </thead>
        <tbody>
          {routes?.map((r) => (
            <Tr key={r.id}>
              <Td className="border p-2">{r.to_account}</Td>
              <Td className="border p-2">{`${r.percent / 100}%`}</Td>
              <Td className="border p-2">{r.auto_vest ? i18next.t("g.yes") : i18next.t("g.no")}</Td>
              <Td className="border p-2">
                <Tooltip content={i18next.t("g.delete")}>
                  <Button
                    className="ml-2"
                    noPadding={true}
                    appearance="gray-link"
                    onClick={() =>
                      onDeleteRoute &&
                      onDeleteRoute({
                        account: r.to_account,
                        percent: 0,
                        auto: "no"
                      })
                    }
                    icon={<UilTrashAlt />}
                  />
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
