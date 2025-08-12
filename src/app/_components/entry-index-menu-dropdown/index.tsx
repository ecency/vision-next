import React from "react";
import { useGlobalStore } from "@/core/global-store";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, MenuItem } from "@ui/dropdown";
import i18next from "i18next";
import { menuDownSvg } from "@ui/svg";
import { Button } from "@ui/button";

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
  const activeUser = useGlobalStore((s) => s.activeUser);
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);

  let dropDownItems: MenuItem[] = [
    {
      label: <span>{i18next.t("entry-filter.filter-global")}</span>,
      selected: tag === "" || tag === "global",
      onClick: () => onTagValueClick("global")
    },
    {
      label: <span>{i18next.t("entry-filter.filter-community")}</span>,
      selected: tag === "my",
      onClick: () => onTagValueClick("my")
    }
  ];

  // if (filter === 'created') {
  //   dropDownItems = [
  //     ...dropDownItems,
  //     for adding new menu items - example shown below
  //     {
  //       label: <span>Now</span>,
  //       active: tag === "right_now",
  //       onClick: () => console.log('right_now clicked'),
  //     },
  //   ]
  // }

  if (filter === "rising") {
    dropDownItems = [
      {
        label: <span>{i18next.t("entry-filter.filter-today")}</span>,
        selected: tag === "today",
        onClick: () => onTagValueClick("today")
      },
      {
        label: <span>{i18next.t("entry-filter.filter-week")}</span>,
        selected: tag === "week",
        onClick: () => onTagValueClick("week")
      },
      {
        label: <span>{i18next.t("entry-filter.filter-month")}</span>,
        selected: tag === "month",
        onClick: () => onTagValueClick("month")
      },
      {
        label: <span>{i18next.t("entry-filter.filter-year")}</span>,
        selected: tag === "year",
        onClick: () => onTagValueClick("year")
      },
      {
        label: <span>{i18next.t("entry-filter.filter-alltime")}</span>,
        selected: tag === "all",
        onClick: () => onTagValueClick("all")
      }
    ];
  }
  if (filter === "controversial") {
    dropDownItems = [
      {
        label: <span>{i18next.t("entry-filter.filter-week")}</span>,
        selected: tag === "week",
        onClick: () => onTagValueClick("week")
      },
      {
        label: <span>{i18next.t("entry-filter.filter-month")}</span>,
        selected: tag === "month",
        onClick: () => onTagValueClick("month")
      },
      {
        label: <span>{i18next.t("entry-filter.filter-year")}</span>,
        selected: tag === "year",
        onClick: () => onTagValueClick("year")
      },
      {
        label: <span>{i18next.t("entry-filter.filter-alltime")}</span>,
        selected: tag === "all",
        onClick: () => onTagValueClick("all")
      }
    ];
  }

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
          {tag === "" || tag === "global"
            ? i18next.t("entry-filter.filter-global")
            : tag === "my"
              ? i18next.t("entry-filter.filter-community")
              : tag === "today"
                ? i18next.t("entry-filter.filter-today")
                : tag === "week"
                  ? i18next.t("entry-filter.filter-week")
                  : tag === "month"
                    ? i18next.t("entry-filter.filter-month")
                    : tag === "year"
                      ? i18next.t("entry-filter.filter-year")
                      : tag === "all"
                        ? i18next.t("entry-filter.filter-alltime")
                        : tag === `%40${activeUser?.username}` || tag.startsWith("%40")
                          ? noReblog
                            ? i18next.t("entry-filter.filter-no-reblog")
                            : i18next.t("entry-filter.filter-with-reblog")
                          : tag}
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
