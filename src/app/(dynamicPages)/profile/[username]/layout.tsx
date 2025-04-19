import { ProfileCard, ProfileCover, ProfileMenu, ProfileSearch } from "./_components";
import { getAccountFullQuery } from "@/api/queries";
import { PropsWithChildren } from "react";
import "./profile.scss";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfileLayout({ params, children }: PropsWithChildren<Props>) {
  const { username } = await params;

  const account = await getAccountFullQuery(username.replace("%40", "")).prefetch();

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="profile-page pt-[72px] md:pt-[128px] max-w-[1600px] px-4 md:px-6 lg:px-8 mx-auto grid md:grid-cols-12 gap-4 md:gap-6 xl:gap-8 bg-blue-duck-egg dark:bg-dark-700 min-h-[100vh] items-start">
        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-xl">
          {account && <ProfileCard account={account} />}

          <span itemScope={true} itemType="http://schema.org/Person">
            <meta itemProp="name" content={account?.profile?.name || account?.name} />
          </span>
        </div>
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <ProfileMenu username={username.replace("%40", "")} />
          {account && <ProfileCover account={account} />}
          <ProfileSearch username={username.replace("%40", "")} />

          {children}
        </div>
      </div>
    </>
  );
}
