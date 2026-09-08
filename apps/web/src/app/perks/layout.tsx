import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import { PropsWithChildren } from "react";
import { PerksHeader } from "./components";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="reading-background pt-[63px] md:pt-[69px] pb-24 md:pb-16">
      <Feedback />
      <Navbar />
      <div className="container mx-auto">
        <PerksHeader />
        {children}
      </div>
    </div>
  );
}
