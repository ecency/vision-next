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
import Image from "next/image";

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
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-blue-dark-sky to-blue-duck-egg backdrop-blur-lg -z-[1]" />
      <div className="fixed top-0 left-0 w-full h-full bg-white/80 dark:bg-black/90 backdrop-blur-lg -z-[1]" />
      <div className="profile-page pt-[72px] md:pt-[128px] max-w-[1600px] sm:px-4 md:px-6 lg:px-8 mx-auto flex gap-4 min-h-[100vh] items-start">
        <motion.div
          // onViewportEnter={() => setShowSidebar(true)}
          // onViewportLeave={() => setShowSidebar(false)}
          className={clsx(
            " bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl min-w-[280px] max-w-[280px]",
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
