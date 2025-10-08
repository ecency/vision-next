"use client";

import useMount from "react-use/lib/useMount";

export function FaqSearchListener({ searchResult }: { searchResult: string[] }) {
  useMount(() => {
    if (window.location.hash) {
      document.querySelector(`${window.location.hash}`)?.scrollIntoView({ behavior: "smooth" });
    }
  });

  return <></>;
}
