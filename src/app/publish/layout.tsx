import { Feedback, Navbar, Theme } from "@/features/shared";
import React, { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="bg-blue-duck-egg dark:bg-dark-700">
        <div className="pt-24 min-h-[100vh]">{children}</div>
      </div>
    </>
  );
}
