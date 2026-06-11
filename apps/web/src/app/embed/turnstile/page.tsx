import { Metadata } from "next";
import { TurnstileEmbed } from "./turnstile-embed";

// Internal utility page consumed by the mobile app's WebView — keep it out of
// search indexes.
export const metadata: Metadata = {
  title: "Turnstile",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <TurnstileEmbed />;
}
