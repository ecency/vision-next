import {catchPostImage, renderPostBody, setProxyBase} from "@ecency/render-helper";
import React from "react";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import i18next from "i18next";
import Link from "next/link";
import { ProposalListItem } from "../_components";
import { parseDate } from "@/utils";
import Head from "next/head";
import { notFound } from "next/navigation";
import { getProposalQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useGlobalStore } from "@/core/global-store";
import "../_page.scss";
import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { Button } from "@ui/button";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import defaults from "@/defaults.json";

export interface Props {
  params: Promise<{
    id: string;
  }>;
}
setProxyBase(defaults.imageServer);
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getProposalQuery(+id).prefetch();
  const basic = await PagesMetadataGenerator.getForPage("proposals");
  return {
    ...basic,
    title: `${basic.title} | ${proposal?.subject}`,
    description: proposal?.creator ?? basic.description
  };
}

export default async function ProposalDetailsPage({ params }: Props) {
  const { id } = await params;
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);

  const proposal = await getProposalQuery(+id).prefetch();
  const entry = await EcencyEntriesCacheManagement.getEntryQueryByPath(
    proposal?.creator,
    proposal?.permlink
  ).prefetch();

  if (!proposal || !entry) {
    return notFound();
  }

  const renderedBody = { __html: renderPostBody(entry?.body ?? "", false, canUseWebp) };

  return (
    <>
      <Head>
        <title>{`${i18next.t("proposals.page-title")} | ${proposal?.subject}`}</title>
        <meta name="description" content={`${proposal?.subject} by @${proposal?.creator}`} />
        <meta
          property="og:title"
          content={`${i18next.t("proposals.page-title")} | ${proposal?.subject}`}
        />
        <meta property="og:description" content={`${proposal?.subject} by @${proposal?.creator}`} />
        {entry && (
          <meta
            property="og:image"
            content={catchPostImage(entry.body, 600, 500, canUseWebp ? "webp" : "match")}
          />
        )}
        <meta property="og:url" content={`/proposals/${proposal?.id}`} />
        {entry && (
          <>
            <meta property="og:modified" content={parseDate(entry.updated).toISOString()} />
            <meta property="og:published" content={parseDate(entry.created).toISOString()} />
          </>
        )}
        <link rel="canonical" href={`/proposals/${proposal?.id}`} />
      </Head>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <div className="app-content proposals-page pt-16">
        <Link className="block my-4 lg:my-6 xl:my-8" href="/proposals">
          <Button
            icon={<UilArrowLeft className="w-4 h-4" />}
            iconPlacement="left"
            appearance="gray-link"
          >
            {i18next.t("proposals.page-title")}
          </Button>
        </Link>
        <div className="proposal-list relative">
          {proposal && <ProposalListItem proposal={proposal} />}
        </div>
        <div className="the-entry">
          <div
            className="entry-body markdown-view user-selectable"
            suppressHydrationWarning
            dangerouslySetInnerHTML={renderedBody}
          />
        </div>
      </div>
    </>
  );
}
