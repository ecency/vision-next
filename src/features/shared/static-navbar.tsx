import { Button } from "@ui/button";
import Image from "next/image";
import Link from "next/link";

interface Props {
  fullVersionUrl: string;
}

export const StaticNavbar = ({ fullVersionUrl }: Props) => {
  return (
    <>
      <div className="sticky-container" id="sticky-container">
        <div className="nav-bar-sm sticky">
          <div className="brand">
            <Link href="/">
              <Image
                src="assets/logo-circle.svg"
                className="logo"
                style={{ width: "40px", height: "40px" }}
                alt="Logo"
              />
            </Link>
          </div>
          <div className="text-menu">
            <a className="menu-item mt-0" href="/discover">
              Discover
            </a>
            <a className="menu-item mt-0" href="/communities">
              Communities
            </a>
          </div>
        </div>
        <div className="nav-bar">
          <div className="nav-bar-inner">
            <div className="brand">
              <Link href="/">
                <Image
                  src="assets/logo-circle.svg"
                  className="logo"
                  style={{ width: "40px", height: "40px" }}
                  alt="Logo"
                />
              </Link>
            </div>
            <div className="text-menu">
              <a className="menu-item mt-0" href="/discover">
                Discover
              </a>
              <a className="menu-item mt-0" href="/communities">
                Communities
              </a>
            </div>
            <div className="flex-spacer" />
            <a className="btn btn-primary" href={fullVersionUrl}>
              View full version
            </a>
          </div>
        </div>
      </div>

      <div className="p-3 w-full fixed bottom-0 md:hidden view-full-version">
        <Button size="sm" full={true} href={fullVersionUrl}>
          View full version
        </Button>
      </div>
    </>
  );
};
