"use client";

import { PropsWithChildren } from "react";
import { WaveViewToolbar } from "@/app/waves/[author]/[permlink]/_components";

export default function WaveViewLayout(props: PropsWithChildren<{}>) {
  return (
    <>
      <WaveViewToolbar />
      {props.children}
    </>
  );
}
