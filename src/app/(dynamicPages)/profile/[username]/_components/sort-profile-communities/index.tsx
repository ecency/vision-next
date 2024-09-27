import React, { useMemo } from "react";
import i18next from "i18next";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, MenuItem } from "@ui/dropdown";
import { Button } from "@ui/button";
import { UilSort } from "@tooni/iconscout-unicons-react";

interface Props {
  sortCommunitiesInAsc: Function;
  sortCommunitiesInDsc: Function;
  sort: string;
}

export const SortCommunities = ({ sortCommunitiesInAsc, sortCommunitiesInDsc, sort }: Props) => {
  const label = useMemo(
    () =>
      sort ? i18next.t("sort-trending-tags.ascending") : i18next.t("sort-trending-tags.descending"),
    [sort]
  );

  let dropDownItems: MenuItem[] = [
    {
      label: <span id="ascending">{i18next.t("sort-trending-tags.ascending")}</span>,
      onClick: () => {
        sortCommunitiesInAsc();
      }
    },
    {
      label: <span id="descending">{i18next.t("sort-trending-tags.descending")}</span>,
      onClick: () => {
        sortCommunitiesInDsc();
      }
    }
  ];

  return (
    <Dropdown className="mb-4">
      <DropdownToggle>
        <Button appearance="gray-link" icon={<UilSort />}>
          {label}
        </Button>
      </DropdownToggle>
      <DropdownMenu align="right">
        {dropDownItems.map((item, i) => (
          <DropdownItem key={i} onClick={item.onClick}>
            {item.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
