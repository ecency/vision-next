import "@/styles/style.scss";
import Providers from "@/app/providers";
import { HiringConsoleLog } from "@/app/_components";
import { cookies } from "next/headers";
import { Theme } from "@/enums";
import { BannerManager } from "@/features/banners";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = cookies().get("theme")?.value;

  return (
    <html lang="en">
      <body className={theme === Theme.night ? "dark" : ""}>
        <BannerManager />
        <HiringConsoleLog />
        <Providers>{children}</Providers>
        <div id="modal-overlay-container" />
        <div id="modal-dialog-container" />
        <div id="popper-container" />
      </body>
    </html>
  );
}
