import { format } from "date-fns";
import i18next from "i18next";
import {
  Children,
  PropsWithChildren,
  ReactNode,
  useMemo,
  useState,
  MouseEvent,
  KeyboardEvent,
} from "react";

const HIVE_ENGINE_OPERATION_FALLBACK_LABELS: Record<string, string> = {
  market_buy: "Market buy",
  market_placeOrder: "Market order placed",
  market_closeOrder: "Market order closed",
  distribution_pending: "Distribution check pending distributions",
};

function getOperationFallbackLabel(type: string) {
  const specificLabel = HIVE_ENGINE_OPERATION_FALLBACK_LABELS[type];

  if (specificLabel) {
    return specificLabel;
  }

  const withSpaces = type
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

interface Props {
  icon: ReactNode;
  type: string;
  timestamp: string | number;
  numbers: ReactNode;
  rawDetails?: unknown;
}

export function ProfileWalletTokenHistoryHiveItem({
  icon,
  type,
  timestamp,
  children,
  numbers,
  rawDetails,
}: PropsWithChildren<Props>) {
  const operationLabel = useMemo(
    () =>
      i18next.t(`transactions.type-${type}`, {
        defaultValue: getOperationFallbackLabel(type),
      }),
    [type]
  );

  const hasRawDetails = rawDetails !== undefined;
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedRawDetails = useMemo(
    () => (hasRawDetails ? JSON.stringify(rawDetails, null, 2) : null),
    [hasRawDetails, rawDetails]
  );

  const hasDetailsContent = Children.count(children) > 0;
  const hasNumberContent = Children.count(numbers ?? null) > 0;

  const toggleExpansion = () => {
    if (!hasRawDetails) {
      return;
    }

    setIsExpanded((value) => !value);
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!hasRawDetails) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest("a, button")) {
      return;
    }

    toggleExpansion();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasRawDetails) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest("a, button")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpansion();
    }
  };

  return (
    <div
      className={`border-b border-[--border-color] last:border-0${
        hasRawDetails
          ? " group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
          : ""
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={hasRawDetails ? "button" : undefined}
      tabIndex={hasRawDetails ? 0 : undefined}
      aria-expanded={hasRawDetails ? isExpanded : undefined}
    >
      <div
        className={`leading-[1] p-4 flex flex-col gap-4 md:grid md:grid-cols-[32px_minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] md:items-start md:gap-4${
          hasRawDetails
            ? " transition-colors group-hover:bg-gray-50 dark:group-hover:bg-gray-900/20"
            : ""
        }`}
      >
        <div className="flex items-start gap-3 md:col-span-2 md:col-start-1 md:row-start-1 md:gap-4">
          <div className="text-blue-dark-sky bg-blue-duck-egg dark:bg-blue-dark-grey flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="transaction-title">
              <div>{operationLabel}</div>
              <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                {format(new Date(timestamp), "dd.MM.yyyy hh:mm")}
              </div>
            </div>
            {hasDetailsContent ? (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 md:hidden">
                {children}
              </div>
            ) : null}
            {hasNumberContent ? (
              <div className="mt-3 text-blue-dark-sky font-medium md:hidden">{numbers}</div>
            ) : null}
          </div>
        </div>
        {hasDetailsContent ? (
          <div className="hidden min-w-0 text-sm text-gray-600 dark:text-gray-400 md:block md:col-start-3 md:self-start">
            {children}
          </div>
        ) : null}
        {hasNumberContent ? (
          <div className="hidden text-right font-medium text-blue-dark-sky md:block md:col-start-4 md:self-start">
            {numbers}
          </div>
        ) : null}
      </div>

      {hasRawDetails && isExpanded && formattedRawDetails && (
        <div className="px-4 pb-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="rounded-md bg-gray-100 dark:bg-gray-900/40 p-3 overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words">{formattedRawDetails}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
