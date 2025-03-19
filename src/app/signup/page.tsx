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
      title: "Signup with Email",
      description:
        "Flexible way to create an account using email validation. Choose one of the options such as Free and Boosted account with 3X resource credits for $2.99 or Onboard a friend",
      buttonText: "Continue with Email",
      image: "/assets/undraw-mailbox.svg",
      href: "/signup/email",
      label: "Email"
    },
    {
      title: "Signup with Wallet",
      description:
        "Create an account for free with Bitcoin, Ethereum, Solana and more blockchain wallets.",
      image: "/assets/undraw-crypto-wallet.svg",
      buttonText: "Continue with Wallet",
      href: "/signup/wallet",
      label: "Crypto wallet"
    }
  ];

  return (
    <div className="grid gric-cols-1 md:grid-cols-2 gap-6 py-6">
      {options.map((option) => (
        <div key={option.title} className="bg-white rounded-2xl p-6 flex flex-col justify-between">
          <div className="uppercase opacity-50 font-bold text-sm">{option.label}</div>
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
  );
}
