import { getAccountFullQuery } from "@/api/queries";
import { FullAccount } from "@/entities";
import { useGlobalStore } from "@/core/global-store";

/**
 * Hook to access the active user's account data with proper loading states.
 *
 * This hook replaces the need for checking `__loaded` flag by using React Query's
 * native loading states. Components should check `isLoading` instead of `__loaded`.
 *
 * @returns {Object} Account state
 * @returns {ActiveUser | null} activeUser - The raw active user object from the global store
 * @returns {string | null} username - The active username
 * @returns {FullAccount | null | undefined} account - The full account data (undefined during loading, null if no user)
 * @returns {boolean} isLoading - True during initial fetch
 * @returns {boolean} isPending - True when query is disabled or loading
 * @returns {boolean} isError - True if fetch failed
 * @returns {Error | null} error - Error object if fetch failed
 * @returns {Function} refetch - Manual refetch function
 * @returns {boolean} isSuccess - True when data is successfully loaded
 *
 * @example
 * ```tsx
 * function VotingPower() {
 *   const { account, isLoading } = useActiveAccount();
 *
 *   if (isLoading) {
 *     return <Spinner />;
 *   }
 *
 *   if (!account) {
 *     return null;
 *   }
 *
 *   const power = votingPower(account);
 *   return <span>{power}%</span>;
 * }
 * ```
 */
export function useActiveAccount() {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const query = getAccountFullQuery(activeUser?.username).useClientQuery();

  return {
    activeUser,
    username: activeUser?.username ?? null,
    account: query.data as FullAccount | null | undefined,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch
  };
}
