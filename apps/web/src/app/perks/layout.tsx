import { Feedback, Navbar } from "@/features/shared";
import { PropsWithChildren } from "react";
import { PerksHeader } from "./components";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
      <Feedback />
      <Navbar experimental={true} />
      <div className="container mx-auto">
        <PerksHeader />
        {children}
      </div>
    </div>
  );
}
