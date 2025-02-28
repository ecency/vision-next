import { Feedback, Navbar } from "@/features/shared";
import { PropsWithChildren } from "react";
import Image from "next/image";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      {/* <Navbar experimental={true} /> */}
      <Feedback />
      <div className="min-h-[calc(100vh-4rem)] md:py-8 bg-blue-duck-egg dark:bg-dark-700">
        <div className="flex items-center justify-center gap-4  py-4 md:py-8 lg:py-12">
          <Image
            src="/assets/logo-circle.svg"
            className="logo relative min-w-[40px] max-w-[40px]"
            alt="Logo"
            width={40}
            height={40}
          />
          <div className="font-bold text-xl">Welcome to Ecency Authentication</div>
        </div>
        {children}
      </div>
    </>
  );
}
