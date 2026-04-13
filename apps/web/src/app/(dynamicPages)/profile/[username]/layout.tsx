import { ProfileCard, ProfileMenu, ProfileSearch } from "./_components";
import { PropsWithChildren } from "react";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import "./profile.scss";
import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import { ProfileCardLoading } from "./_components/profile-card/profile-card-loading";
import { prefetchQuery } from "@/core/react-query";

interface Props extends PropsWithChildren {
  params: Promise<{ username: string }>;
}

export default async function ProfileLayout({ children, params }: Props) {
  const { username: usernameParam } = await params;
  const username = usernameParam.replace("%40", "");

  const account = await prefetchQuery(getAccountFullQueryOptions(username));

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-blue-dark-sky to-blue-duck-egg backdrop-blur-lg -z-[1]" />
      <div className="fixed top-0 left-0 w-full h-full bg-white/80 dark:bg-black/90 backdrop-blur-lg -z-[1]" />
      <div className="pb-20 md:pb-0 profile-page pt-0 sm:pt-4 md:pt-[128px] max-w-[1600px] sm:px-2 md:px-2 mx-auto flex flex-col lg:flex-row gap-0 sm:gap-4 min-h-[100vh] items-start w-full">
        <div
          className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-none sm:rounded-xl lg:min-w-[280px] lg:max-w-[280px] w-full overflow-hidden"
        >
          {account ? <ProfileCard account={account} /> : <ProfileCardLoading />}

          <span itemScope={true} itemType="http://schema.org/Person">
            <meta itemProp="name" content={account?.profile?.name || account?.name} />
          </span>
        </div>
        <div className="w-full min-w-0">
          <ProfileMenu username={username} />
          <ProfileSearch username={username} />

          {children}
        </div>
      </div>
    </>
  );
}
