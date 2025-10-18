"use client";

import { Feedback, Navbar, Theme } from "@/features/shared";
import { PropsWithChildren } from "react";
import { PublishOnboarding } from "./_components";
import "./page.scss";
import { PublishStateProvider } from "./_hooks";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <PublishStateProvider>
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="bg-blue-duck-egg dark:bg-dark-700 pb-4 md:pb-8 xl:pb-12">
        <div className="md:pt-24 min-h-[100vh] mb-24 md:mb-0">{children}</div>
      </div>
      <PublishOnboarding />
    </PublishStateProvider>
  );
}
