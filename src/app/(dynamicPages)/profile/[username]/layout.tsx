import {
  ProfileCard,
  ProfileCover,
  ProfileMenu,
  ProfileSearch
} from "@/app/[...slugs]/_profile-components";
import { getAccountFullQuery } from "@/api/queries";
import { PropsWithChildren } from "react";
import "./profile.scss";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";

interface Props {
  params: { username: string };
}

export default async function ProfileLayout({
  params: { username },
  children
}: PropsWithChildren<Props>) {
  const account = await getAccountFullQuery(username).prefetch();

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
          <ProfileMenu username={username} />
          {account && <ProfileCover account={account} />}
          <ProfileSearch username={username} />
          {children}
        </div>
      </div>
    </>
  );
}
