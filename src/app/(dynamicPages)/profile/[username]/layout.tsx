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
      <Navbar />
      <div className="app-content profile-page">
        <div className="profile-side">{account && <ProfileCard account={account} />}</div>
        <span itemScope={true} itemType="http://schema.org/Person">
          <meta itemProp="name" content={account?.profile?.name || account?.name} />
        </span>
        <div className="content-side">
          <ProfileMenu username={username.replace("%40", "")} />
          {account && <ProfileCover account={account} />}
          <ProfileSearch username={username.replace("%40", "")} />
          {children}
        </div>
      </div>
    </>
  );
}
