import React, { useEffect, useState } from "react";
import "./index.scss";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import {
  getAccountFullQueryOptions,
  getIncomingRcQueryOptions,
  getOutgoingRcDelegationsInfiniteQueryOptions
} from "@ecency/sdk";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { LinearProgress, ProfileLink, UserAvatar } from "@/features/shared";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { delegateRC } from "@/api/operations";
import { rcFormatter } from "@/utils";
import { FullAccount } from "@/entities";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  showDelegation: () => void;
  listMode: string;
  setToFromList: (value: string) => void;
  setAmountFromList: (value: string) => void;
  confirmDelete: () => void;
  setDelegateeData: (value: any) => void;
  setShowDelegationsList: (value: boolean) => void;
  account: FullAccount;
}

export const RcDelegationsList = ({
  showDelegation,
  listMode,
  setToFromList,
  setAmountFromList,
  confirmDelete,
  setDelegateeData,
  setShowDelegationsList,
  account
}: Props) => {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  const otherUser = account.name;
  const {
    data: outgoingPages,
    fetchNextPage,
    hasNextPage,
    isLoading: outgoingLoading,
    isFetchingNextPage
  } = useInfiniteQuery(getOutgoingRcDelegationsInfiniteQueryOptions(otherUser));
  const outGoingList = outgoingPages?.pages.flat() ?? [];
  const [incoming, setIncoming]: any = useState([]);
  const [incomingLoading, setIncomingLoading] = useState(false);
  const [search, setsearch] = useState("");
  const [loadList, setLoadList] = useState(21);

  useEffect(() => {
    getIncomingRcList();
  }, [otherUser]);

  const getIncomingRcList = async () => {
    setIncomingLoading(true);
    const delegationsIn: any = await queryClient.fetchQuery(
      getIncomingRcQueryOptions(otherUser)
    );
    const incomingInfo = delegationsIn.list;
    setIncoming(incomingInfo);
    setIncomingLoading(false);
  };

  const loading = outgoingLoading || incomingLoading || isFetchingNextPage;

  const loadMore = async () => {
    const moreList = loadList + 7;
    if (listMode === "out" && moreList > outGoingList.length && hasNextPage) {
      await fetchNextPage();
    }
    setLoadList(moreList);
  };

  const getToData = async (data: any) =>
    queryClient.fetchQuery(getAccountFullQueryOptions(data));
  const searchLower = search.toLowerCase();

  return (
    <div className="delgations-list">
      {loading && (
        <div className="delegation-loading">
          <LinearProgress />
        </div>
      )}
      <div className="list-container">
        <div className="search-box mb-4">
          <FormControl
            type="text"
            value={search}
            placeholder="search list"
            onChange={(e) => setsearch(e.target.value)}
          />
        </div>

        {listMode === "out" && (
          <>
            {outGoingList.length > 0 ? (
              <div className="list-body">
                {outGoingList
                  ?.filter((list: any) => {
                    const toLower = list.to.toLowerCase();
                    return (
                      toLower.startsWith(searchLower) ||
                      toLower.includes(searchLower)
                    );
                  })
                  .slice(0, loadList)
                  .map((list: any) => (
                    <div className="list-item" key={list.to}>
                      <div className="item-main">
                        <ProfileLink username={list.to}>
                          <UserAvatar username={list.to} size="small" />
                        </ProfileLink>
                        <div className="item-info">
                          <ProfileLink username={list.to}>
                            <span className="item-name notranslate">{list.to}</span>
                          </ProfileLink>
                        </div>
                        <div className="item-extra actionable">
                          <Tooltip content={list.delegated_rc}>
                            <span>{rcFormatter(list.delegated_rc)}</span>
                          </Tooltip>
                          {activeUser && otherUser == activeUser.username && (
                            <div className="actions">
                              <a
                                href="#"
                                onClick={async () => {
                                  showDelegation();
                                  setShowDelegationsList(false);
                                  setAmountFromList(list.delegated_rc);
                                  setToFromList(list.to);
                                  const data = await getToData(list.to);
                                  setDelegateeData(data);
                                }}
                              >
                                {i18next.t("rc-info.update")}
                              </a>
                              <a
                                href="#"
                                onClick={() => {
                                  confirmDelete();
                                  setToFromList(list.to);
                                }}
                              >
                                {i18next.t("rc-info.delete")}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p>{i18next.t("rc-info.no-outgoing")}</p>
            )}
          </>
        )}

        {listMode === "in" && (
          <>
            {incoming.length > 0 ? (
              <div className="list-body">
                {incoming
                  ?.filter((list: any) => {
                    const sender = list.sender.toLowerCase();
                    return (
                      sender.startsWith(searchLower) ||
                      sender.includes(searchLower)
                    );
                  })
                  .slice(0, loadList)
                  .map((list: any, i: any) => (
                    <div className="list-item" key={list.sender}>
                      <div className="item-main">
                        <ProfileLink username={list.sender}>
                          <UserAvatar username={list.sender} size="small" />
                        </ProfileLink>
                        <div className="item-info">
                          <ProfileLink username={list.sender}>
                            <span className="item-name notranslate">{list.sender}</span>
                          </ProfileLink>
                        </div>
                        <div className="item-extra">
                          <Tooltip content={list.amount}>
                            <span>{rcFormatter(list.amount)}</span>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p>{i18next.t("rc-info.no-incoming")}</p>
            )}
          </>
        )}

        {((listMode === "in" && incoming.length > loadList) ||
          (listMode === "out" && (outGoingList.length > loadList || hasNextPage))) && (
          <div className="load-more-btn">
            <Button onClick={loadMore}>{i18next.t("g.load-more")}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmDeleteProps {
  to: string;
  hideConfirmDelete: () => void;
}

export const ConfirmDelete = ({ to, hideConfirmDelete }: ConfirmDeleteProps) => {
  const { activeUser } = useActiveAccount();
  return (
    <>
      <div className="container">
        <h5 className="text" style={{ width: "350px", alignSelf: "center" }}>
          {i18next.t("rc-info.confirm-delete")}
        </h5>
        <div className="flex justify-center p-3">
          <Button
            className="mr-2"
            appearance="secondary"
            outline={true}
            onClick={hideConfirmDelete}
          >
            {i18next.t("rc-info.cancel")}
          </Button>
          <Button
            className="ml-2"
            onClick={() => {
              delegateRC(activeUser!.username, to, 0);
              hideConfirmDelete();
            }}
          >
            {i18next.t("rc-info.confirm")}
          </Button>
        </div>
      </div>
    </>
  );
};
