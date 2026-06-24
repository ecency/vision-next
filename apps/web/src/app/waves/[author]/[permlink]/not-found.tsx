import i18next from "i18next";
import Image from "next/image";
import { initI18next } from "@/features/i18n";
import defaults from "@/defaults";
import { NotFoundBackButton } from "@/app/not-found-back-button";

// Rendered (with a 404 status) when a wave can't be resolved, most commonly
// because its author deleted it on-chain but it is still referenced from a
// cached feed. Friendlier than the generic 404 and keeps the user in /waves.
export default async function WaveNotFound() {
  await initI18next();

  return (
    <div
      className="bg-repeat"
      style={{
        backgroundSize: "200px",
        backgroundImage: `url(/assets/circle-pattern.svg)`
      }}
    >
      <div className="container mx-auto p-4 flex flex-col justify-center items-center gap-6 min-h-[60vh] text-center">
        <Image src={defaults.logo} alt="logo" width={64} height={64} />
        <h1 className="text-2xl font-semibold">{i18next.t("waves.not-available")}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          {i18next.t("waves.not-available-hint")}
        </p>
        <NotFoundBackButton fallbackHref="/waves">
          {i18next.t("waves.back-to-waves")}
        </NotFoundBackButton>
      </div>
    </div>
  );
}
