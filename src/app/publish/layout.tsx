import { Feedback, Navbar, Theme } from "@/features/shared";
import React, { PropsWithChildren } from "react";
import { PublishActionBar } from "@/app/publish/_components";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="bg-blue-duck-egg dark:bg-dark-700 pb-4 md:pb-8 xl:pb-12">
        <div className="pt-24 min-h-[100vh]">
          <PublishActionBar />
          {children}
          <PublishActionBar />
        </div>
      </div>
    </>
  );
}
