import { Feedback, Navbar } from "@/features/shared";
import { PropsWithChildren } from "react";
import Image from "next/image";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar experimental={true} />
      <Feedback />
      <div className="min-h-[100vh] md:pb-8 pt-[6rem] bg-blue-duck-egg dark:bg-dark-700 px-2">
        <div className="container mx-auto flex items-center justify-start gap-4 py-4 md:py-8 lg:py-12">
          <Image
            src="/assets/logo-circle.svg"
            className="logo relative min-w-[40px] max-w-[40px]"
            alt="Logo"
            width={40}
            height={40}
          />
          <div>
            <div className="font-bold text-xl">Ecency Authentication</div>
            <div>Signup by external wallets</div>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
