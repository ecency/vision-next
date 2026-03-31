import { Navbar } from "@/features/shared/navbar";
import { Theme } from "@/features/shared/theme";
import { HsCallbackPage } from "./_page";

export const dynamic = "force-dynamic";

export default function HsCallback() {
  return (
    <>
      <Theme />
      <Navbar />
      <HsCallbackPage />
    </>
  );
}
