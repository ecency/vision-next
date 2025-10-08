"use client";

import React from "react";
import useMountedState from "react-use/lib/useMountedState";

export function Tracker() {
  const isMounted = useMountedState();
  return isMounted() ? (
    <>
    </>
  ) : (
    <></>
  );
}
