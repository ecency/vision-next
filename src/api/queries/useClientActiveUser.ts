"use client";

import { useEffect, useState } from "react";
import { useGlobalStore } from "@/core/global-store";
import { ActiveUser } from "@/entities";

export function useClientActiveUser(): ActiveUser | null {
    const activeUser = useGlobalStore((s) => s.activeUser);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated ? activeUser ?? null : null;
}
