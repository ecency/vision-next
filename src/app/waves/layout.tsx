"use client";

import { Feedback, Navbar, ScrollToTop } from "@/features/shared";
import { PropsWithChildren, useCallback, useState } from "react";
import { classNameObject } from "@ui/util";
import { useMount, useUnmount } from "react-use";

export default function WavesLayout(props: PropsWithChildren) {
  const [scroll, setScroll] = useState(0);

  const handleScroll = useCallback((event: Event) => setScroll(window.scrollY), []);

  useMount(() => window.addEventListener("scroll", handleScroll));
  useUnmount(() => window.removeEventListener("scroll", handleScroll));

  return (
    <div
      className={classNameObject({
        "bg-blue-duck-egg dark:bg-dark-700 min-h-full": true,
        "[&_.ecency-navbar-desktop]:rounded-b-none": scroll <= 32
      })}
    >
      <Feedback />
      <ScrollToTop />
      <Navbar experimental={true} />
      <div className="container pt-[156px] mx-auto grid grid-cols-12">
        <div className="col-span-3"></div>
        <div className="col-span-6">{props.children}</div>
        <div className="col-span-3"></div>
      </div>
    </div>
  );
}
