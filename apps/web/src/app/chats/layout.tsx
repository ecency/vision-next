import { Feedback, Navbar } from "@/features/shared";
import { PropsWithChildren } from "react";

export default function Layout(props: PropsWithChildren) {
  return (
    <>
      <Feedback />
      <Navbar />
      <div className="bg-blue-duck-egg dark:bg-transparent pt-4 md:pt-[69px] h-full-dynamic pb-24 md:pb-0">
        <div className="container mx-auto py-4 md:py-6">
          <div className="grid grid-cols-12 overflow-hidden md:rounded-2xl bg-white md:border border-[--border-color] relative h-full-dynamic md:min-h-full md:max-h-full">
            {props.children}
          </div>
        </div>
      </div>
    </>
  );
}
