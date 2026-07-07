import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-24 md:pb-16">
      <Feedback />
      <Navbar experimental={true} />
      <div className="container mx-auto px-4">{children}</div>
    </div>
  );
}
