import { Feedback, Navbar } from "@/features/shared";
import { PropsWithChildren } from "react";
import { ChatsClient } from "./_components/chats-client";

export default function Layout(props: PropsWithChildren) {
  return (
    <>
      <Feedback />
      <Navbar />
      <div className="bg-blue-duck-egg dark:bg-transparent pt-4 md:pt-[69px] h-full-dynamic pb-24 md:pb-0">
        <div className="container mx-auto h-full py-4 md:py-6">
          <div className="grid h-full min-h-full grid-cols-1 overflow-hidden rounded-2xl border border-[--border-color] bg-white md:grid-cols-[320px_1fr]">
            <div className="min-h-[300px] border-b border-[--border-color] bg-[--surface-color] md:border-b-0 md:border-r">
              <ChatsClient />
            </div>
            <div className="relative h-full min-h-[420px] bg-white">{props.children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
