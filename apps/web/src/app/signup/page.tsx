import { PagesMetadataGenerator } from "@/features/metadata";
import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("signup");
}

const options = [
  {
    title: i18next.t("signup-email.title"),
    description: i18next.t("signup-email.description"),
    buttonText: i18next.t("signup-email.buttonText"),
    image: "/assets/undraw-mailbox.svg",
    href: "/signup/email",
    label: i18next.t("signup-email.label")
  },
  {
    title: i18next.t("signup-wallets.title"),
    description: i18next.t("signup-wallets.description"),
    image: "/assets/undraw-crypto-wallet.svg",
    buttonText: i18next.t("signup-wallets.buttonText"),
    href: "/signup/wallet",
    label: i18next.t("signup-wallets.label")
  }
];

export default function Page() {
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
