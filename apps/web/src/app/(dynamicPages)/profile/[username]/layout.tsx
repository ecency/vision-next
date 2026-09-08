import "@/features/shared/reading-layout/reading-layout.scss";
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
import { JsonLd, buildProfileJsonLd } from "@/features/structured-data";

interface Props extends PropsWithChildren {
  params: Promise<{ username: string }>;
}

export default async function ProfileLayout({ children, params }: Props) {
  const { username: usernameParam } = await params;
  const username = usernameParam.replace(/%40/g, "");

  const account = await prefetchQuery(getAccountFullQueryOptions(username));

  return (
    <div className="reading-page">
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar readingLayout />
      <div className="pb-20 md:pb-0 profile-page reading-list-layout max-w-[1600px] sm:px-2 md:px-2 mx-auto flex flex-col lg:flex-row gap-0 sm:gap-4 min-h-[100vh] items-start w-full">
        <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-none sm:rounded-xl lg:min-w-[280px] lg:max-w-[280px] w-full overflow-hidden">
          {account ? <ProfileCard account={account} /> : <ProfileCardLoading />}

          {account && <JsonLd data={buildProfileJsonLd({ account, username })} />}
        </div>
        <div className="w-full min-w-0">
          <ProfileMenu username={username} />
          <ProfileSearch username={username} />

          {children}
        </div>
      </div>
    </div>
  );
}
