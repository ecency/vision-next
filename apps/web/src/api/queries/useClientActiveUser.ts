"use client";

import { useHydrated } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { ActiveUser } from "@/entities";

export function useClientActiveUser(): ActiveUser | null {
    const hydrated = useHydrated();
    const activeUser = useGlobalStore((s) => s.activeUser);

    return hydrated ? activeUser ?? null : null;
}
