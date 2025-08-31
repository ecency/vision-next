import { LinearProgress, ProfileLink, UserAvatar } from "@/features/shared";
import { List, ListItem } from "@/features/ui/list";
import { formattedNumber, parseAsset, vestsToHp } from "@/utils";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { getHivePowerDelegatingsQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@ui/index";
import { FormControl } from "@ui/input";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { useMemo, useState } from "react";

interface Props {
  username: string;
  show: boolean;
  setShow: (v: boolean) => void;
}

export function ReceivedVesting({ show, setShow, username }: Props) {
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

  const { data: vestingShares, isLoading } = useQuery(
    getHivePowerDelegatingsQueryOptions(username)
  );

  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const sliced = useMemo(
    () =>
      vestingShares
        ?.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
        ?.filter((item) =>
          item.delegator.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
        ) ?? [],
    [vestingShares, page, pageSize, searchText]
  );

  return (
    <Modal onHide={() => setShow(false)} show={show} centered={true}>
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("received-vesting.title")}</ModalTitle>
      </ModalHeader>
      <div className="w-full px-3 pb-4">
        <FormControl
          type="text"
          placeholder={i18next.t("friends.search-placeholder")}
          value={searchText}
          onChange={(e) => {
            let text = e.target.value;
            setSearchText(text);
          }}
        />
      </div>
      <ModalBody>
        <div className="received-vesting-content">
          {isLoading && <LinearProgress />}
          <div className="user-list">
            <List grid={true} inline={true} defer={true}>
              {sliced.length === 0 && <div className="empty-list">{i18next.t("g.empty-list")}</div>}
              {sliced.map((x) => (
                <ListItem styledDefer={true} className="list-item" key={x.delegator}>
                  <div className="item-main">
                    <ProfileLink username={x.delegator}>
                      <UserAvatar username={x.delegator} size="small" />
                    </ProfileLink>
                    <div className="item-info">
                      <ProfileLink username={x.delegator}>
                        <span className="item-name notranslate">{x.delegator}</span>
                      </ProfileLink>
                    </div>
                  </div>
                  <div className="item-extra">
                    <Tooltip content={x.vesting_shares}>
                      <span>
                        {formattedNumber(
                          vestsToHp(
                            parseAsset(x.vesting_shares).amount,
                            dynamicProps?.hivePerMVests!
                          ),
                          {
                            suffix: "HP"
                          }
                        )}
                      </span>
                    </Tooltip>
                  </div>
                </ListItem>
              ))}
            </List>

            <Pagination
              className="mt-4"
              dataLength={vestingShares?.length ?? 0}
              pageSize={pageSize}
              maxItems={4}
              page={page}
              onPageChange={(page: number) => setPage(page)}
            />
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
