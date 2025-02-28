import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import { PagesMetadataGenerator } from "@/features/metadata";
import { Feedback, Navbar } from "@/features/shared";
import i18next from "i18next";
import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("signup");
}

export default function Page() {
  const options = [
    {
      title: "Signup by Email",
      buttonText: "Continue with email",
      href: "/signup/wallet"
    },
    {
      title: "Signup by external wallets",
      buttonText: "Continue with wallets",
      href: "/signup/wallet"
    }
  ];

  return (
    <div className="bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
      <Feedback />
      <Navbar experimental={true} />

      <div className="container mx-auto mt-6 md:mt-8">
        <div className="relative">
          <div className="absolute bottom-0 left-0 p-6 xl:p-8 items-end justify-start col-span-6 rounded-2xl">
            <h1 className="text-white text-xl md:text-5xl md:leading-[4rem]">
              <b>{i18next.t("sign-up.header")}</b> – {i18next.t("sign-up.description")}
            </h1>
          </div>

          <div className="col-span-12 md:col-span-6 top-16 rounded-2xl overflow-hidden">
            <Image
              width={1920}
              height={1920}
              src="/assets/signup-bg.jpeg"
              alt=""
              className="w-full max-h-[600px] object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6">
          <div className="bg-white rounded-2xl p-6">
            <Button size="lg" icon={<UilArrowRight />}>
              Continue with email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
