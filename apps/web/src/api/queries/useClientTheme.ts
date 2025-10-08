"use client";

import { useHydrated } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { Theme } from "@/enums";

export function useClientTheme(): [Theme, (theme?: Theme) => void] {
    const hydrated = useHydrated();
    const toggleTheme = useGlobalStore((s) => s.toggleTheme);
    const theme = useGlobalStore((s) => s.theme);

    return [hydrated ? theme as Theme : Theme.system, hydrated ? toggleTheme : () => {}];
}
