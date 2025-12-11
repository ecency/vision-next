"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { useHydrated } from "@/api/queries";
import { ActiveUser } from "@/entities";

/**
 * @deprecated Prefer `useActiveAccount().activeUser` to avoid maintaining two hooks.
 * This helper remains for components that only need the active user and expect
 * a hydration guard before accessing the client store.
 */
export function useClientActiveUser(): ActiveUser | null {
    const hydrated = useHydrated();
    const { activeUser } = useActiveAccount();

    return hydrated ? activeUser ?? null : null;
}
