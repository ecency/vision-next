import { useDelegateVestingSharesByKey, useDelegateVestingSharesByKeychain } from "@/api/mutations";
import { delegateVestingSharesHot } from "@/api/operations";
import { DEFAULT_DYNAMIC_PROPS } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { KeyOrHotDialog, LinearProgress, ProfileLink, UserAvatar } from "@/features/shared";
import { List, ListItem } from "@/features/ui/list";
import { formattedNumber, parseAsset, vestsToHp } from "@/utils";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { getHivePowerDelegatesInfiniteQueryOptions } from "@/features/wallet/sdk";
import { useQuery } from "@tanstack/react-query";
import { Pagination, Tooltip } from "@ui/index";
import { FormControl } from "@ui/input";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import { useEffect, useMemo, useState } from "react";

interface Props {
  username: string;
  show: boolean;
  setShow: (v: boolean) => void;
  totalDelegated: string;
}

export function DelegatedVesting({ username, show, setShow, totalDelegated }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

  const [subtitle, setSubtitle] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [hideList, setHideList] = useState(false);

  const { data: delegations, isLoading } = useQuery({
    ...getHivePowerDelegatesInfiniteQueryOptions(username, 1000),
    select: (data) =>
      data?.sort(
        (a, b) => parseAsset(b.vesting_shares).amount - parseAsset(a.vesting_shares).amount
      )
  });

  const { mutateAsync: delegateByKey } = useDelegateVestingSharesByKey();
  const { mutateAsync: delegateByKeychain } = useDelegateVestingSharesByKeychain();

  const data = useMemo(
    () =>
      delegations?.filter((item) =>
        item.delegatee.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
      ) ?? [],
    [delegations, searchText]
  );
  const sliced = useMemo(
    () => data.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    [data, page, pageSize]
  );

  useEffect(() => {
    const totalDelegatedValue = data.reduce((n, item) => {
      let parsedValue: any = parseAsset(item.vesting_shares).amount;
      parsedValue = vestsToHp(parsedValue, (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests);
      parsedValue = formattedNumber(parsedValue);
      parsedValue = parsedValue.replace(/,/g, "");
      parsedValue = parseFloat(parsedValue);
      parsedValue = n + parsedValue;
      return parsedValue;
    }, 0);

    const totalDelegatedNumbered = parseFloat(totalDelegated.replace(" HP", "").replace(",", ""));
    const toBeReturned = totalDelegatedNumbered - totalDelegatedValue;
    setSubtitle(toBeReturned.toFixed(3));
  }, [data, dynamicProps, totalDelegated]);

  return (
    <Modal onHide={() => setShow(false)} show={show} centered={true}>
      <ModalHeader closeButton={true}>
        <ModalTitle>
          <div>
            <div>{i18next.t("delegated-vesting.title")}</div>
            <div className="text-gray-600 mt-3 text-sm">{subtitle}</div>
          </div>
        </ModalTitle>
      </ModalHeader>

      <div className="w-full mb-4 px-3">
        <FormControl
          type="text"
          placeholder={i18next.t("friends.search-placeholder")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <ModalBody>
        {isLoading && <LinearProgress />}
        {!isLoading && (
          <div
            className={`delegated-vesting-content ${isLoading ? "in-progress" : ""} ${
              hideList ? "hidden" : ""
            }`}
          >
            <div className="user-list">
              <List defer={true} grid={true} inline={true} className="list-body">
                {sliced.length === 0 && (
                  <div className="empty-list">{i18next.t("g.empty-list")}</div>
                )}
                {sliced.map((x) => (
                  <ListItem styledDefer={true} className="list-item" key={x.delegatee}>
                    <div className="item-main">
                      <ProfileLink username={x.delegatee}>
                        <UserAvatar username={x.delegatee} size="small" />
                      </ProfileLink>
                      <div className="item-info">
                        <ProfileLink username={x.delegatee}>
                          <span className="item-name notranslate">{x.delegatee}</span>
                        </ProfileLink>
                      </div>
                    </div>
                    <div className="item-extra">
                      <Tooltip content={x.vesting_shares}>
                        <span>
                          {formattedNumber(
                            vestsToHp(
                              parseAsset(x.vesting_shares).amount,
                              (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests
                            ),
                            { suffix: "HP" }
                          )}
                        </span>
                      </Tooltip>
                      {activeUser && activeUser.username === x.delegatee && (
                        <KeyOrHotDialog
                          popOver={true}
                          onToggle={() => setHideList(!hideList)}
                          onKey={(key) =>
                            delegateByKey({
                              key,
                              value: "0.000000 VESTS",
                              delegatee: x.delegatee
                            })
                          }
                          onHot={() =>
                            delegateVestingSharesHot(
                              activeUser.username,
                              x.delegatee,
                              "0.000000 VESTS"
                            )
                          }
                          onKc={() =>
                            delegateByKeychain({
                              value: "0.000000 VESTS",
                              delegatee: x.delegatee
                            })
                          }
                        >
                          <a href="#" className="undelegate">
                            {i18next.t("delegated-vesting.undelegate")}
                          </a>
                        </KeyOrHotDialog>
                      )}
                    </div>
                  </ListItem>
                ))}
              </List>
              <Pagination
                className="mt-4"
                dataLength={data.length}
                pageSize={pageSize}
                maxItems={4}
                page={page}
                onPageChange={(page: number) => setPage(page)}
              />
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
