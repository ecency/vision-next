import { getAccountFullQuery } from "@/api/queries";
import { Skeleton } from "@/features/shared";
import { accountReputation } from "@/utils";
import { getRelationshipBetweenAccountsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import Link from "next/link";
import { useMemo } from "react";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  username: string;
}

export function ProfilePreviewUsername({ username }: Props) {
  const { activeUser } = useActiveAccount();

  const { data: account, isLoading: isProfileLoading } =
    getAccountFullQuery(username).useClientQuery();

  const { data: relationsBetweenAccounts, isLoading: followsActiveUserLoading } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(username, activeUser?.username)
  );

  const followsActiveUser = useMemo(
    () => relationsBetweenAccounts?.follows ?? false,
    [relationsBetweenAccounts?.follows]
  );
  const reputation = useMemo(
    () => account && accountReputation(account.reputation),
    [account]
  );

  return (
    <>
      <div>
        {isProfileLoading ? <Skeleton className="loading-md" /> : account && account.profile?.name}
      </div>
      <Link href={`/@${username}`}>
        {isProfileLoading ? (
          <Skeleton className="loading-md my-3" />
        ) : (
          `@${username} (${reputation})`
        )}
      </Link>
      <div>
        {activeUser && followsActiveUserLoading ? (
          <Skeleton className="loading-md my-3" />
        ) : followsActiveUser ? (
          i18next.t("profile.follows-you")
        ) : null}
      </div>
    </>
  );
}
