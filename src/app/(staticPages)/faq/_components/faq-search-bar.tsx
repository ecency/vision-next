"use client";

import { FormControl, InputGroup } from "@ui/input";
import { Button } from "@ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { success } from "@/features/shared";
import i18next from "i18next";
import { clipboard } from "@/utils/clipboard";
import { useGlobalStore } from "@/core/global-store";
import { copyContent } from "@ui/svg";

export function FaqSearchBar() {
  const params = useSearchParams();
  const router = useRouter();

  const lang = useGlobalStore((state) => state.lang);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setSearch(params.get("q") ?? "");
  }, [params]);

  const handleChangeSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearch(value);
    setTyping(value.length !== 0);
  }, []);

  useDebounce(
    () => {
      if (search) {
        router.push(`?q=${encodeURIComponent(search)}`);
      } else if (params.has("q")) {
        router.push("?");
      }
    },
    1000,
    [search, params]
  );

  const copyToClipboard = useCallback((text: string) => {
    success(i18next.t("static.faq.search-link-copied"));
    clipboard(text);
  }, []);

  return (
    <>
      <InputGroup
        append={
          <Button
            size="sm"
            className="copy-to-clipboard"
            disabled={search.length === 0}
            onClick={() => {
              copyToClipboard(`https://ecency.com/faq?q=${search}&lang=${lang.split("-")[0]}`);
            }}
            icon={copyContent}
          />
        }
        className="mb-3 w-[75%]"
      >
        <FormControl
          type="text"
          placeholder={`${i18next.t("static.faq.search-placeholder")}`}
          className="w-[75%]"
          onChange={handleChangeSearch}
          value={search}
          autoFocus={true}
        />
      </InputGroup>
    </>
  );
}
