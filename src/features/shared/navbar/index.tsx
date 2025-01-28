"use client";

import React, { useEffect, useState } from "react";
import usePrevious from "react-use/lib/usePrevious";
import * as ls from "@/utils/local-storage";
import useMount from "react-use/lib/useMount";
import "./_index.scss";
import { NavbarMobile } from "./navbar-mobile";
import { NavbarDesktop } from "./navbar-desktop";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Theme } from "@/enums";
import { useGlobalStore } from "@/core/global-store";
import { LoginDialog, NotificationsDialog } from "@/features/shared";
import { classNameObject } from "@ui/util";

interface Props {
  step?: number;
  setStepOne?: () => void;
  setStepTwo?: () => void;
  experimental?: boolean; // Use this flag for testing something
}

export function Navbar({ setStepOne, setStepTwo, step, experimental = false }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const toggleTheme = useGlobalStore((state) => state.toggleTheme);
  const uiLogin = useGlobalStore((state) => state.login);

  const router = useRouter();
  const query = useSearchParams();
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);

  const [transparentVerify, setTransparentVerify] = useState(false);
  const [smVisible, setSmVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mainBarExpanded, setMainBarExpanded] = useState(false);

  const previousActiveUser = usePrevious(activeUser);

  useMount(() => {
    // referral check / redirect
    if (location.pathname.startsWith("/signup") && query.has("referral")) {
      router.push(`/signup?referral=${query.get("referral")}`);
    }
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleSetTheme);

    return () => {
      document.getElementsByTagName("body")[0].classList.remove("overflow-hidden");
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handleSetTheme);
    };
  });

  useEffect(() => {
    if (smVisible) {
      document.getElementsByTagName("body")[0].classList.add("overflow-hidden");
    } else {
      document.getElementsByTagName("body")[0].classList.remove("overflow-hidden");
    }
  }, [smVisible]);

  useEffect(() => {
    if (previousPathname !== pathname || previousActiveUser !== activeUser) {
      if (pathname === "/" && !activeUser) {
        setStepOne && setStepOne();
      } else {
        setStepTwo && setStepTwo();
      }
    }
  }, [pathname, previousPathname, activeUser, previousActiveUser, setStepOne, setStepTwo]);

  useEffect(() => {
    setTransparentVerify(
      pathname.startsWith("/hot") ||
        pathname.startsWith("/created") ||
        pathname.startsWith("/trending")
    );
  }, [pathname]);

  const handleSetTheme = () => {
    const useSystem = ls.get("use_system_theme", false);
    let theme = ls.get("theme");
    if (useSystem) {
      theme =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? Theme.night
          : Theme.day;
    }
    toggleTheme(theme);
  };

  return (
    <div
      className={classNameObject({
        "fixed z-20 top-0 left-0 right-0 flex flex-col justify-start": true,
        "md:p-2": experimental
      })}
      id="sticky-container"
    >
      <NavbarMobile
        expanded={expanded}
        setExpanded={setExpanded}
        mainBarExpanded={mainBarExpanded}
        setMainBarExpanded={setMainBarExpanded}
        step={step}
      />
      <NavbarDesktop
        transparentVerify={transparentVerify}
        mainBarExpanded={mainBarExpanded}
        setMainBarExpanded={setMainBarExpanded}
        step={step}
        setStepOne={setStepOne}
        setSmVisible={setSmVisible}
        experimental={experimental}
      />
      {uiLogin && <LoginDialog />}
      {/*Do not remove from here because it`s controlling by global store*/}
      <NotificationsDialog />
    </div>
  );
}
