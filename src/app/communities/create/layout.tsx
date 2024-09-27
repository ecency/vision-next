import { Feedback, Navbar, Theme } from "@/features/shared";
import { PropsWithChildren } from "react";

export default function CommunityCreateLayout({ children }: PropsWithChildren) {
  return (
    <>
      <Theme />
      <Feedback />
      <Navbar />
      <div className="app-content py-10 bg-gray-100 dark:bg-dark-200-010 min-h-[calc(100vh-44px)] m-0">
        {children}
      </div>
    </>
  );
}
