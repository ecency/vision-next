import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import { PropsWithChildren } from "react";
import "./entry.scss";

export default function EntryPageLayout(props: PropsWithChildren) {
  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      {props.children}
    </>
  );
}
