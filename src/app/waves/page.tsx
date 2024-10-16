import { Feedback } from "@/features/shared";
import Image from "next/image";
import i18next from "i18next";
import Link from "next/link";
import { Button } from "@ui/button";

export default function WavesPage() {
  return (
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
            <Image src="/assets/logo-circle.svg" alt="logo" width={72} height={72} />
            <h1 className="text-8xl font-black text-blue-dark-sky">Waves</h1>
          </div>
          <h2 className="text-2xl font-semibold">Cooking something cool 😎</h2>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button>{i18next.t("not-found.back-home")}</Button>
            </Link>
          </div>
        </div>
        <Image src="/assets/illustration-open-source.png" alt="logo" width={571} height={460} />
      </div>
    </div>
  );
}
