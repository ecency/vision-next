import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import { PagesMetadataGenerator } from "@/features/metadata";
import { Feedback, Navbar } from "@/features/shared";
import i18next from "i18next";
import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import Link from "next/link";

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
      description:
        "Flexible way to create an account using email validation. Free account, full-fledged account with 3X resource credits for $2.99 or onboard friend",
      buttonText: "Continue with email",
      image: "/assets/undraw-mailbox.svg",
      href: "/signup/email"
    },
    {
      title: "Signup by external wallets",
      description:
        "Create an account for free and create/import external wallet in Bitcoin, Ethereum, Solana and more blockchains. Create an account and track your funds",
      image: "/assets/undraw-crypto-wallet.svg",
      buttonText: "Continue with wallets",
      href: "/signup/wallet"
    }
  ];

  return (
    <div className=" bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
      <Feedback />
      <Navbar experimental={true} />

      <div className="container px-2 mx-auto mt-6 md:mt-8">
        <div className="grid grid-cols-12 mb-10 items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10">
          <div className="col-span-12 md:col-span-6">
            <h1 className="text-xl md:text-3xl font-bold md:leading-[3rem]">
              {i18next.t("sign-up.header")}
            </h1>
            <h2 className="text-lg md:text-2xl">{i18next.t("sign-up.description")}</h2>
          </div>

          <div className="col-span-12 md:col-span-6 top-16 rounded-2xl overflow-hidden">
            <Image
              width={1920}
              height={1920}
              src="/assets/signup-main.svg"
              alt=""
              className="w-full max-h-[400px] object-cover"
            />
          </div>
        </div>

        <div className="grid gric-cols-1 md:grid-cols-2 gap-6 py-6">
          {options.map((option) => (
            <div
              key={option.title}
              className="bg-white rounded-2xl p-6 flex flex-col justify-between"
            >
              <div className="uppercase opacity-50 font-bold text-sm">Signup option</div>
              <div className="flex flex-col gap-4">
                <Image
                  src={option.image}
                  alt=""
                  width={400}
                  height={400}
                  className="max-w-[200px] md:max-w-[300px] mx-auto my-6"
                />
                <div className="text-xl font-bold">{option.title}</div>
                <div className="text-gray-600 dark:text-gray-400">{option.description}</div>
                <Link href={option.href}>
                  <Button size="lg" icon={<UilArrowRight />}>
                    {option.buttonText}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
