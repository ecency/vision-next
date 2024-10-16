import { Feedback, Navbar, ScrollToTop } from "@/features/shared";
import { PropsWithChildren } from "react";

export default function WavesLayout(props: PropsWithChildren) {
  return (
    <>
      <Feedback />
      <ScrollToTop />
      <Navbar />
      {props.children}
    </>
  );
}
