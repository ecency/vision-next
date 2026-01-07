"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 540;
const MOBILE_DATA_LIMIT = 5;
const DESKTOP_DATA_LIMIT = 20;

const getViewportDataLimit = (width: number) =>
  width < MOBILE_BREAKPOINT ? MOBILE_DATA_LIMIT : DESKTOP_DATA_LIMIT;

export function useDataLimit() {
  const [dataLimit, setDataLimit] = useState(DESKTOP_DATA_LIMIT);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateLimit = () => {
      setDataLimit(getViewportDataLimit(window.innerWidth));
    };

    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  return dataLimit;
}
