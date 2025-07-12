import { useContext } from "react";
import { Entry } from "@/entities";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";

export function useEffectiveEntry(fallbackEntry: Entry): Entry {
    const { liveEntry } = useContext(EntryPageContext);
    return liveEntry ?? fallbackEntry;
}
