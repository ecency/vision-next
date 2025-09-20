"use client";

import { useDebounce } from "react-use";
import { LinearProgress, SearchBox } from "@/features/shared";
import i18next from "i18next";
import React, { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useMount from "react-use/lib/useMount";
import { useGlobalStore } from "@/core/global-store";
import clsx from "clsx";
import { ListStyle } from "@/enums";

interface Props {
  username: string;
}

export function ProfileSearch({ username }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const listStyle = useGlobalStore((s) => s.listStyle);

  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);

  const pathname = usePathname();
  const section = useMemo(() => pathname?.split("/")[2] ?? "posts", [pathname]);

  useMount(() => {
    setSearch(params?.get("query") ?? "");
  });

  const handleChangeSearch = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearch(value);
    setTyping(value.length !== 0);
  }, []);

  useDebounce(
    () => {
      if (search) {
        router.push(`${pathname}/?query=${encodeURIComponent(search)}`);
        setTyping(false);
      } else if (params?.has("query")) {
        router.push(`${pathname}`);
        setTyping(false);
      }
    },
    3000,
    [search, params]
  );

  if (!["blog", "", "posts", "comments"].includes(section)) {
    return <></>;
  }

  return (
    <div
      className={clsx(
        "bg-white p-2 md:p-4",
        listStyle === ListStyle.grid ? "rounded-xl mb-4" : " rounded-t-xl"
      )}
    >
      <SearchBox
        placeholder={i18next.t("search-comment.search-placeholder")}
        value={search}
        onChange={handleChangeSearch}
        autoComplete="off"
        showcopybutton={true}
        username={`@${username}`}
        filter={section}
      />

      {typing && (
        <div className="mt-3">
          <LinearProgress />
        </div>
      )}
    </div>
  );
}
