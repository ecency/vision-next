import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import { PropsWithChildren } from "react";

// Without this layout the page rendered with no navbar, so a logged-out visitor from the
// launch announcement had no way to log in — the LoginDialog is mounted inside Navbar, and
// card checkout needs a logged-in user, so the community "Continue" button (which opens the
// login dialog) did nothing at all. Mirrors gift/perks/signup layouts.
export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-24 md:pb-16">
      <Feedback />
      <Navbar experimental={true} />
      <div className="container mx-auto px-4">{children}</div>
    </div>
  );
}
