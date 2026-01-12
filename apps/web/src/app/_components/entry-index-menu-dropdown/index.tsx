import React from "react";
import { useGlobalStore } from "@/core/global-store";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, MenuItem } from "@ui/dropdown";
import i18next from "i18next";
import { menuDownSvg } from "@ui/svg";
import { Button } from "@ui/button";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  onChangeGlobal: (v: string) => void;
  noReblog: boolean;
  handleFilterReblog: () => void;
  filter: string;
  tag: string;
}

export const EntryIndexMenuDropdown = ({
  noReblog,
  handleFilterReblog,
  onChangeGlobal,
  filter,
  tag
}: Props) => {
  const { activeUser } = useActiveAccount();
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);

  let dropDownItems: MenuItem[] = [
    {
      label: <span>{i18next.t("entry-filter.filter-global")}</span>,
      selected: tag !== "my", // Any tag that's not "my" is considered global (including tag="", "global", "photography", etc.)
      onClick: () => onTagValueClick("global")
    },
    {
      label: <span>{i18next.t("entry-filter.filter-community")}</span>,
      selected: tag === "my",
      onClick: () => onTagValueClick("my")
    }
  ];

  if (filter === "feed") {
    dropDownItems = [
      {
        label: (
          <span>
            {noReblog
              ? i18next.t("entry-filter.filter-with-reblog")
              : i18next.t("entry-filter.filter-no-reblog")}
          </span>
        ),
        selected: tag === "no_reblog",
        onClick: () => onTagValueClick("no_reblog")
      }
    ];
  }

  const onTagValueClick = (key: string) => {
    if (key === "my" && !activeUser) {
      toggleUIProp("login");
    } else if (key === "no_reblog") {
      handleFilterReblog();
    } else {
      onChangeGlobal(key);
    }
  };

  return (
    <Dropdown>
      <DropdownToggle>
        <Button icon={menuDownSvg} appearance="gray-link" size="sm">
          {tag === "my"
            ? i18next.t("entry-filter.filter-community")
            : tag === `%40${activeUser?.username}` || tag.startsWith("%40")
              ? noReblog
                ? i18next.t("entry-filter.filter-no-reblog")
                : i18next.t("entry-filter.filter-with-reblog")
              : i18next.t("entry-filter.filter-global")}
        </Button>
        <DropdownMenu align="left">
          {dropDownItems.map((item, i) => (
            <DropdownItem key={i} onClick={item.onClick}>
              {item.label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </DropdownToggle>
    </Dropdown>
  );
};
