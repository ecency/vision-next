"use client";

import { ProfileCard, ProfileMenu, ProfileSearch } from "./_components";
import { getAccountFullQuery } from "@/api/queries";
import { PropsWithChildren, useState } from "react";
import "./profile.scss";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { ProfileCardLoading } from "./_components/profile-card/profile-card-loading";

interface Props {
  params: Promise<{ username: string }>;
}

export default function ProfileLayout({ params, children }: PropsWithChildren<Props>) {
  const { username } = useParams();

  const [showSidebar, setShowSidebar] = useState(true);

  const { data: account } = getAccountFullQuery(
    (username as string).replace("%40", "")
  ).useClientQuery();

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar experimental={true} />
      <div className="profile-page pt-[72px] md:pt-[128px] max-w-[1600px] sm:px-4 md:px-6 lg:px-8 mx-auto flex gap-4 md:gap-6 xl:gap-8 bg-blue-duck-egg dark:bg-dark-700 min-h-[100vh] items-start">
        <motion.div
          // onViewportEnter={() => setShowSidebar(true)}
          // onViewportLeave={() => setShowSidebar(false)}
          className={clsx(
            "bg-white rounded-xl min-w-[280px] max-w-[280px]",
            showSidebar ? "static" : "md:absolute"
          )}
        >
          {account ? <ProfileCard account={account} /> : <ProfileCardLoading />}

          <span itemScope={true} itemType="http://schema.org/Person">
            <meta itemProp="name" content={account?.profile?.name || account?.name} />
          </span>
        </motion.div>
        <div className="w-full">
          <ProfileMenu username={(username as string).replace("%40", "")} />
          <ProfileSearch username={(username as string).replace("%40", "")} />

          {children}
        </div>
      </div>
    </>
  );
}
