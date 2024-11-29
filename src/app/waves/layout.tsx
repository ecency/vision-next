"use client";

import { Feedback, Navbar, ScrollToTop } from "@/features/shared";
import { PropsWithChildren, ReactNode, useCallback, useState } from "react";
import { classNameObject } from "@ui/util";
import { useMount, useUnmount } from "react-use";
import { usePathname } from "next/navigation";

interface Props {
  view: ReactNode;
}

export default function WavesLayout(props: PropsWithChildren<Props>) {
  const [scroll, setScroll] = useState(0);

  const pathname = usePathname();
  const handleScroll = useCallback(() => setScroll(window.scrollY), []);

  useMount(() => window.addEventListener("scroll", handleScroll));
  useUnmount(() => window.removeEventListener("scroll", handleScroll));

  return (
    <div
      className={classNameObject({
        "bg-blue-duck-egg dark:bg-dark-700 min-h-[100vh]": true,
        "[&_.ecency-navbar-desktop]:rounded-b-none": pathname === "/waves" ? scroll <= 32 : false
      })}
    >
      <Feedback />
      <ScrollToTop />
      <Navbar experimental={true} />
      <div
        className={classNameObject({
          "container mx-auto grid grid-cols-12": true,
          "pt-[156px]": pathname === "/waves",
          "pt-[96px]": pathname !== "/waves"
        })}
      >
        <div className="col-span-3"></div>
        <div className="col-span-6">{props.children}</div>
        <div className="col-span-3"></div>
      </div>
    </div>
  );
}
