import { Button } from "@/features/ui";
import { UilBars } from "@tooni/iconscout-unicons-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  onClick: () => void;
}

export function NavbarMainSidebarToggle({ onClick }: Props) {
  return (
    <div className="h-[40px] min-w-[40px] md:min-w-[60px] flex items-center gap-1.5 cursor-pointer relative">
      <Button onClick={onClick} appearance="gray-link" noPadding={true} icon={<UilBars />} />
      <Link className="hidden md:block" href="/">
        <Image
          src="/assets/logo-circle.svg"
          className="logo relative min-w-[40px] max-w-[40px]"
          alt="Logo"
          width={40}
          height={40}
        />
      </Link>
    </div>
  );
}
