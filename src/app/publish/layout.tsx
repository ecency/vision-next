"use client";

import { Feedback, Navbar, Theme } from "@/features/shared";
import { PropsWithChildren } from "react";
import { PublishOnboarding } from "./_components";
import "./page.scss";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="bg-blue-duck-egg dark:bg-dark-700 pb-4 md:pb-8 xl:pb-12">
        <div className="md:pt-24 min-h-[100vh]">{children}</div>
      </div>
      <PublishOnboarding />
    </>
  );
}
