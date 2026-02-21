"use client";

import { useEffect, useState } from "react";

export function useCountdown(initialTime: number) {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((time) => {
        if (time === 0) {
          clearInterval(timer);
          return 0;
        } else return time - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return [time, setTime] as const;
}
