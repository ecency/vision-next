"use client";

import { getProMembersQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { checkSvg } from "@ui/svg";
import clsx from "clsx";
import i18next from "i18next";
import { isProMember } from "./pro-config";

interface Props {
  username: string;
  className?: string;
}

/**
 * Small X-style verified checkmark shown next to a username when it belongs to an
 * active Ecency Pro member. The roster is a single cached, public query, so this is
 * cheap to drop wherever a username renders.
 */
export function ProBadge({ username, className }: Props) {
  const { data } = useQuery(getProMembersQueryOptions());

  if (!isProMember(data?.members, username)) {
    return null;
  }

  const label = i18next.t("pro.badge-title");

  return (
    <span
      title={label}
      aria-label={label}
      className={clsx(
        "inline-flex items-center justify-center align-middle rounded-full bg-blue-dark-sky text-white size-4 shrink-0 [&>svg]:size-3",
        className
      )}
    >
      {checkSvg}
    </span>
  );
}
