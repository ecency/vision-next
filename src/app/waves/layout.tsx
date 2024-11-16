import { Feedback, Navbar, ScrollToTop } from "@/features/shared";
import { PropsWithChildren } from "react";

export default function WavesLayout(props: PropsWithChildren) {
  return (
    <div className="bg-blue-duck-egg dark:bg-dark-700 min-h-full">
      <Feedback />
      <ScrollToTop />
      <Navbar />
      <div className="container mx-auto grid grid-cols-12">
        <div className="col-span-3"></div>
        <div className="col-span-12 lg:col-span-8 xl:col-span-7 mt-[96px]">{props.children}</div>
      </div>
    </div>
  );
}
