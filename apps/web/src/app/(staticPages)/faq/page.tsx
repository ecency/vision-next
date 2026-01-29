import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { Metadata, ResolvingMetadata } from "next";
import i18next from "i18next";
import {
  FaqHeroImage,
  FaqSearchBar,
  FaqSearchBarResultInfo,
  FaqSearchListener
} from "@/app/(staticPages)/faq/_components";
import { searchWithinFaq } from "@/app/(staticPages)/faq/utils";
import { Tsx } from "@/features/i18n/helper";
import { NavigationLocaleWatcher } from "@/features/i18n";
import { FaqSearchResult } from "@/app/(staticPages)/faq/_components/faq-search-result";
import { PagesMetadataGenerator } from "@/features/metadata";

export const revalidate = 86400; // 24 hours

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("faq");
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function FAQ({ searchParams }: Props) {
  const params = await searchParams;

  const searchResult = searchWithinFaq(params["q"] ?? "");

  return (
    <>
      <ScrollToTop />
      <Feedback />
      <Theme />
      <Navbar />
      <FaqSearchListener searchResult={searchResult} />
      <NavigationLocaleWatcher searchParams={params} />

      <div
        className="app-content static-page faq-page"
        itemScope={true}
        itemType="https://schema.org/FAQPage"
      >
        <div className="static-content">
          <div className="relative rounded" style={{ marginBottom: "8%" }}>
            <FaqHeroImage />
            <div className="absolute search-container flex justify-center items-center flex-col rounded p-3">
              <h1 className="text-white faq-title text-center mb-3">
                {i18next.t("static.faq.page-title")}
              </h1>
              <FaqSearchBar />
              <FaqSearchBarResultInfo />
            </div>
          </div>
          <FaqSearchResult />

          <div className="faq-list">
            {searchResult.map((x) => {
              return (
                <div
                  key={x}
                  className="faq-item"
                  itemScope={true}
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                  id={x}
                >
                  <h4 className="faq-item-header text-[1.5rem] font-semibold" itemProp="name">
                    {i18next.t(`static.faq.${x}-header`)}
                  </h4>
                  <div
                    itemScope={true}
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                    id="content"
                  >
                    <Tsx k={`static.faq.${x}-body`}>
                      <div className="faq-item-body" itemProp="text" />
                    </Tsx>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
