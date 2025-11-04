"use client";

import { Button } from "@/features/ui";
import {
  HIVE_ACCOUNT_OPERATION_GROUPS,
  HIVE_OPERATION_LIST,
  HIVE_OPERATION_NAME_BY_ID,
} from "@ecency/wallets";
import type {
  HiveOperationFilterValue,
  HiveOperationGroup,
} from "@ecency/wallets";
import { Dropdown, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { closeSvg } from "@ui/svg";
import { clsx } from "clsx";
import i18next from "i18next";
import { useCallback, useMemo } from "react";

export const DEFAULT_HIVE_OPERATION_GROUPS: HiveOperationGroup[] = [
  "rewards",
  "transfers",
  "stake-operations",
  "market-orders",
  "interests",
];

function resolveGroupOperations(
  groups: HiveOperationGroup[]
): HiveOperationFilterValue[] {
  const operations = new Set<HiveOperationFilterValue>();

  groups.forEach((group) => {
    const operationIds = HIVE_ACCOUNT_OPERATION_GROUPS[group];

    if (!operationIds) {
      return;
    }

    operationIds.forEach((id) => {
      const name = HIVE_OPERATION_NAME_BY_ID[id];

      if (name) {
        operations.add(name);
      }
    });
  });

  return Array.from(operations);
}

export const DEFAULT_HIVE_OPERATION_FILTERS: HiveOperationFilterValue[] =
  resolveGroupOperations(DEFAULT_HIVE_OPERATION_GROUPS);

function formatOperationLabel(operation: string) {
  return operation
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface Props {
  selected: HiveOperationFilterValue[];
  onChange: (value: HiveOperationFilterValue[]) => void;
  groups?: HiveOperationGroup[];
}

type FilterOption = {
  value: HiveOperationFilterValue;
  label: string;
};

export function HiveOperationFilterSelect({
  selected,
  onChange,
  groups = DEFAULT_HIVE_OPERATION_GROUPS,
}: Props) {
  const language = i18next.language;

  const normalizedGroups = useMemo(
    () =>
      groups.filter(
        (group): group is HiveOperationGroup =>
          group !== "" && group in HIVE_ACCOUNT_OPERATION_GROUPS
      ),
    [groups]
  );

  const groupLabelLookup = useMemo(() => {
    const map = new Map<HiveOperationFilterValue, string>();

    normalizedGroups.forEach((value) => {
      map.set(value, i18next.t(`transactions.group-${value}`));
    });

    return map;
  }, [normalizedGroups, language]);

  const operationOptions = useMemo<FilterOption[]>(
    () =>
      HIVE_OPERATION_LIST.map((value) => ({
        value: value as HiveOperationFilterValue,
        label: i18next.t(`transactions.operation-${value}`, {
          defaultValue: formatOperationLabel(value),
        }),
      })).sort((a, b) => a.label.localeCompare(b.label)),
    [language]
  );

  const optionLookup = useMemo(() => {
    const map = new Map<HiveOperationFilterValue, string>();
    groupLabelLookup.forEach((label, value) => {
      map.set(value, label);
    });
    operationOptions.forEach(({ value, label }) => {
      map.set(value, label);
    });
    return map;
  }, [groupLabelLookup, operationOptions]);

  const handleToggle = useCallback(
    (value: HiveOperationFilterValue) => {
      const isSelected = selected.includes(value);
      if (isSelected) {
        onChange(selected.filter((item) => item !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [onChange, selected]
  );

  const handleReset = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const selectionSummary = useMemo(() => {
    const labels = selected
      .map((value) => optionLookup.get(value))
      .filter((label): label is string => Boolean(label));

    if (labels.length === 0) {
      if (selected.length === 0) {
        return i18next.t("transactions.filter-summary-all", {
          defaultValue: "All operations",
        });
      }

      return i18next.t("transactions.filter-summary-count", {
        count: selected.length,
        defaultValue: `${selected.length} selected`,
      });
    }

    if (labels.length <= 2) {
      return labels.join(", ");
    }

    return i18next.t("transactions.filter-summary-count", {
      count: labels.length,
      defaultValue: `${labels.length} selected`,
    });
  }, [optionLookup, selected, language]);

  return (
    <Dropdown>
      <DropdownToggle withChevron>
        <Button
          appearance="gray"
          size="sm"
          className="!flex !h-auto !w-full !flex-col !items-start !gap-2 !px-3 !py-2 text-left sm:!w-auto sm:min-w-[220px]"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {i18next.t("transactions.filter-toggle", {
              defaultValue: "Filter ",
            })}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {selectionSummary}
          </span>
        </Button>
      </DropdownToggle>
      <DropdownMenu
        align="right"
        className="!gap-3 !py-3 !pr-3 !min-w-[260px] max-h-[420px] overflow-y-auto"
      >
        {operationOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <span>
                {i18next.t("transactions.filter-operations", {
                  defaultValue: "Operations",
                })}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-medium text-blue-dark-sky hover:text-blue-dark-sky-hover"
              >
                {i18next.t("transactions.filter-reset", {
                  defaultValue: "Reset",
                })}
              </button>
            </div>
            <div className="flex flex-col gap-1 px-3">
              {operationOptions.map((option) => (
                <FilterOptionItem
                  key={`operation-${option.value}`}
                  option={option}
                  selected={selected.includes(option.value)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}

interface FilterOptionItemProps {
  option: FilterOption;
  selected: boolean;
  onToggle: (value: HiveOperationFilterValue) => void;
}

function FilterOptionItem({ option, selected, onToggle }: FilterOptionItemProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(option.value)}
      aria-pressed={selected}
      className={clsx(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        selected
          ? "bg-blue-dark-sky-040 dark:bg-gray-900"
          : "hover:bg-blue-dark-sky-020 dark:hover:bg-gray-800"
      )}
    >
      <span
        className={clsx(
          "flex h-5 w-5 items-center justify-center rounded-md border border-[--border-color] bg-white transition-colors dark:border-gray-700 dark:bg-gray-950",
          selected && "border-blue-dark-sky bg-blue-dark-sky"
        )}
      >
        {selected && (
          <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 text-white">
            {closeSvg}
          </span>
        )}
      </span>
      <span
        className={clsx(
          "flex-1 text-left transition-colors",
          selected
            ? "font-semibold text-blue-dark-sky dark:text-blue-dark-sky"
            : "text-gray-700 dark:text-gray-200"
        )}
      >
        {option.label}
      </span>
    </button>
  );
}
