import { Feedback, Navbar } from "@/features/shared";
import { PropsWithChildren } from "react";
import { ChatsClient } from "./_components/chats-client";

export default function Layout(props: PropsWithChildren) {
  return (
    <>
      <Feedback />
      <Navbar />
      <div className="bg-blue-duck-egg dark:bg-transparent box-border h-[100dvh] pb-24 pt-4 md:overflow-hidden md:pb-0 md:pt-[69px]">
        <div className="mx-auto flex h-full min-h-0 px-4 py-4 md:px-6 md:py-6">
          <div className="grid h-full min-h-0 w-full grid-cols-1 overflow-hidden rounded-2xl border border-[--border-color] bg-white md:grid-cols-[320px_1fr]">
            <div className="hidden min-h-[300px] border-b border-[--border-color] bg-[--surface-color] md:flex md:min-h-0 md:flex-col md:border-b-0 md:border-r md:overflow-hidden">
              <ChatsClient />
            </div>
            <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden bg-white md:min-h-0">{props.children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
