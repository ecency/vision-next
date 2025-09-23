"use client"; // Error boundaries must be Client Components

import { Feedback } from "@/features/shared";
import Image from "next/image";
import i18next from "i18next";
import Link from "next/link";
import { Button } from "@ui/button";
import { SentryIssueReporterDialog } from "@/features/issue-reporter";
import defaults from "@/defaults.json";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Check if this is a chunk-related error
  const isChunkError = 
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("ChunkLoadError") ||
    error.message?.includes("Cannot read properties of null (reading 'parentNode')");

  // For chunk errors, automatically reload the page
  if (isChunkError && typeof window !== "undefined") {
    console.error("Chunk-related error detected in global error handler:", error);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
  return (
    // global-error must include html and body tags
    <html>
      <body>
        <div
          className="bg-repeat"
          style={{
            backgroundSize: "200px",
            backgroundImage: `url(/assets/circle-pattern.svg)`
          }}
        >
          <Feedback />
          <div className="container mx-auto p-4 grid sm:grid-cols-2 gap-4 h-[100vh] items-center">
            <div className="flex flex-col justify-center gap-4 md:gap-8">
              <div className="flex gap-4">
                <Image src={defaults.logo} alt="logo" width={72} height={72} />
                <h1 className="text-8xl font-black text-blue-dark-sky">500</h1>
              </div>
              <h2 className="text-2xl font-semibold">
                {isChunkError 
                  ? "Loading Error - Page will refresh automatically" 
                  : i18next.t("global-error.description")
                }
              </h2>
              {isChunkError && (
                <p className="text-gray-600 dark:text-gray-400">
                  A loading error occurred. The page will refresh in a moment to resolve this issue.
                </p>
              )}
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button>{i18next.t("not-found.back-home")}</Button>
                </Link>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
                <SentryIssueReporterDialog error={error} />
              </div>
            </div>
            <Image src="/assets/illustration-open-source.png" alt="logo" width={571} height={460} />
          </div>
        </div>
        <div id="modal-overlay-container" />
        <div id="modal-dialog-container" />
      </body>
    </html>
  );
}
