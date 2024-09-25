import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { PropsWithChildren } from "react";
import "./entry.scss";

export default async function EntryPageLayout(props: PropsWithChildren) {
  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      {props.children}
    </>
  );
}
