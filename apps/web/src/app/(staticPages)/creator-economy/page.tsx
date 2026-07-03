import Link from "next/link";
import { Navbar } from "@/features/shared/navbar";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import i18next from "i18next";
import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { JsonLd, buildBreadcrumbJsonLd, buildDatasetJsonLd } from "@/features/structured-data";
import { getServerAppBase } from "@/utils/server-app-base";
import defaults from "@/defaults.json";
import quartersData from "./_data/quarters.json";
import { ColumnChart, HBarChart, StatTile } from "./_components/charts";
import { deltaPct, formatCompact, formatFull } from "./_components/chart-utils";

export const revalidate = 86400; // data changes quarterly; rebuild daily is plenty

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const base = await getServerAppBase();
  return {
    ...(await PagesMetadataGenerator.getForPage("creator-economy")),
    alternates: { canonical: `${base}/creator-economy` }
  };
}

// Colors validated with the dataviz palette checker for both surfaces
// (light #fff-ish, dark #131111): series pass lightness/chroma/CVD checks;
// the aqua contrast WARN on light is relieved by direct labels + full tables.
const VIZ_VARS = `
.ce-viz{--ce-s1:#357ce6;--ce-s2:#1baf7a;--ce-grid:#e5e7eb;--ce-text2:#6b7280}
.dark .ce-viz{--ce-s1:#3987e5;--ce-s2:#199e70;--ce-grid:#2f2f2f;--ce-text2:#9ca3af}
`;

export default async function CreatorEconomyPage() {
  const quarters = quartersData.quarters;
  const latest = quarters[quarters.length - 1];
  const prev = quarters[quarters.length - 2];
  const base = (await getServerAppBase()).replace(/\/+$/, "");
  const t = (key: string, args?: Record<string, string>) =>
    i18next.t(`creator-economy.${key}`, args);

  const labels = quarters.map((q) => q.display);
  const hiveSide = (q: (typeof quarters)[number]) => q.rewards.hive + q.rewards.hp;
  const communities = [...latest.topCommunities].sort((a, b) => b.authors - a.authors).slice(0, 8);
  // Chart only the quarters that HAVE curation data (coverage is a contiguous
  // suffix): a zero-height bar would read as "curators earned nothing" while
  // the table correctly says n/a for the same quarter.
  const curationTrend = quarters.flatMap((q) =>
    q.curation ? [{ label: q.display, hp: q.curation.hp }] : []
  );

  const jsonLd = [
    buildDatasetJsonLd({
      name: t("title"),
      description: t("page-description"),
      url: `${base}/creator-economy`,
      temporalCoverage: `${quarters[0].window.start}/${latest.window.end}`
    }),
    buildBreadcrumbJsonLd([
      { name: defaults.name, url: base },
      { name: t("page-title"), url: `${base}/creator-economy` }
    ])
  ];

  return (
    <>
      <Theme />
      <ScrollToTop />
      <Navbar />
      <JsonLd data={jsonLd} />
      <style dangerouslySetInnerHTML={{ __html: VIZ_VARS }} />

      {/* .app-content is display:flex (site-wide); static pages render their
          content inside a single .static-content child (margin:auto, 800px),
          exactly like /faq — otherwise every section becomes a flex column. */}
      <div className="app-content static-page ce-viz">
        <div className="static-content pb-16">
          <h1 className="text-3xl md:text-4xl font-bold mt-8">{t("title")}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{t("intro")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("updated", { q: latest.display })}</p>

          {/* KPI row, latest quarter */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <StatTile
              label={t("tile-authors")}
              value={formatFull(latest.rewards.authors)}
              delta={deltaPct(latest.rewards.authors, prev?.rewards.authors)}
            />
            <StatTile
              label={t("tile-rewards")}
              value={`${formatCompact(hiveSide(latest))} HIVE`}
              delta={deltaPct(hiveSide(latest), prev ? hiveSide(prev) : null)}
            />
            <StatTile
              label={t("tile-usd")}
              value={latest.rewards.usd ? `$${formatFull(latest.rewards.usd)}` : "n/a"}
              delta={deltaPct(latest.rewards.usd ?? 0, prev?.rewards.usd)}
            />
            <StatTile
              label={t("tile-posts")}
              value={formatFull(latest.content.posts)}
              delta={deltaPct(latest.content.posts, prev?.content.posts)}
            />
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3">{t("chart-usd")}</h2>
            <ColumnChart
              labels={labels}
              series={[{ name: "USD", values: quarters.map((q) => q.rewards.usd ?? 0) }]}
              ariaLabel={t("chart-usd")}
              valueFormatter={(n) => `$${formatCompact(n)}`}
            />
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3">{t("chart-authors")}</h2>
            <ColumnChart
              labels={labels}
              series={[{ name: t("tile-authors"), values: quarters.map((q) => q.rewards.authors) }]}
              ariaLabel={t("chart-authors")}
            />
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3">{t("chart-content")}</h2>
            <ColumnChart
              labels={labels}
              series={[
                { name: t("series-posts"), values: quarters.map((q) => q.content.posts) },
                { name: t("series-comments"), values: quarters.map((q) => q.content.comments) }
              ]}
              ariaLabel={t("chart-content")}
            />
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-1">
              {t("communities-title", { q: latest.display })}
            </h2>
            <p className="text-sm text-gray-500 mb-3">{t("communities-note")}</p>
            <HBarChart
              items={communities.map((c) => ({ label: c.title, value: c.authors }))}
              ariaLabel={t("communities-title", { q: latest.display })}
            />
            {/* Table view for the chart (accessibility relief), full top-12 list */}
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left border-b border-[--border-color] text-gray-500">
                  <th className="py-2 pr-3">{t("th-community")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-authors-count")}</th>
                  <th className="py-2 text-right">{t("th-posts-count")}</th>
                </tr>
              </thead>
              <tbody>
                {[...latest.topCommunities]
                  .sort((a, b) => b.authors - a.authors)
                  .map((c) => (
                    <tr key={c.id} className="border-b border-[--border-color]">
                      <td className="py-2 pr-3">
                        <Link href={`/created/${c.id}`} className="text-blue-dark-sky hover:underline">
                          {c.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-right">{formatFull(c.authors)}</td>
                      <td className="py-2 text-right">{formatFull(c.posts)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="text-sm mt-3">
              <Link href="/communities" className="text-blue-dark-sky hover:underline">
                {t("explore-communities")}
              </Link>
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-1">
              {t("distribution-title", { q: latest.display })}
            </h2>
            <p className="text-sm text-gray-500 mb-3">{t("distribution-note")}</p>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[--border-color]">
                  <td className="py-2">{t("dist-median")}</td>
                  <td className="py-2 text-right font-medium">
                    {formatFull(Math.round(latest.perAuthorHp.median))} HP
                  </td>
                </tr>
                <tr className="border-b border-[--border-color]">
                  <td className="py-2">{t("dist-p90")}</td>
                  <td className="py-2 text-right font-medium">
                    {formatFull(Math.round(latest.perAuthorHp.p90))} HP
                  </td>
                </tr>
                <tr className="border-b border-[--border-color]">
                  <td className="py-2">{t("dist-p99")}</td>
                  <td className="py-2 text-right font-medium">
                    {formatFull(Math.round(latest.perAuthorHp.p99))} HP
                  </td>
                </tr>
                <tr>
                  <td className="py-2">{t("dist-max")}</td>
                  <td className="py-2 text-right font-medium">
                    {formatFull(Math.round(latest.perAuthorHp.max))} HP
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-sm">
              {t("cta-lead")}{" "}
              <Link href="/signup" className="text-blue-dark-sky hover:underline font-medium">
                {t("cta-join")}
              </Link>
              .
            </p>
          </section>

          {latest.curation && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold mb-1">{t("curation-title")}</h2>
              <p className="text-sm text-gray-500 mb-3">{t("curation-note")}</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatTile
                  label={t("tile-curators")}
                  value={formatFull(latest.curation.curators)}
                  delta={deltaPct(latest.curation.curators, prev?.curation?.curators)}
                />
                <StatTile
                  label={t("tile-curation-hp")}
                  value={`${formatCompact(latest.curation.hp)} HP`}
                  delta={deltaPct(latest.curation.hp, prev?.curation?.hp)}
                />
              </div>
              <ColumnChart
                labels={curationTrend.map((c) => c.label)}
                series={[
                  { name: t("tile-curation-hp"), values: curationTrend.map((c) => c.hp) }
                ]}
                ariaLabel={t("chart-curation")}
              />
            </section>
          )}

          {/* Full-precision table: the accessible/table view for every chart above */}
          <section className="mt-10 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-3">{t("quarters-title")}</h2>
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left border-b border-[--border-color] text-gray-500">
                  <th className="py-2 pr-3">{t("th-quarter")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-authors")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-hbd")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-hive")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-hp")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-usd")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-posts")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-comments")}</th>
                  <th className="py-2 pr-3 text-right">{t("th-curators")}</th>
                  <th className="py-2 text-right">{t("th-curation-hp")}</th>
                </tr>
              </thead>
              <tbody>
                {quarters.map((q) => (
                  <tr key={q.label} className="border-b border-[--border-color]">
                    <td className="py-2 pr-3">{q.display}</td>
                    <td className="py-2 pr-3 text-right">{formatFull(q.rewards.authors)}</td>
                    <td className="py-2 pr-3 text-right">{formatFull(q.rewards.hbd)}</td>
                    <td className="py-2 pr-3 text-right">{formatFull(q.rewards.hive)}</td>
                    <td className="py-2 pr-3 text-right">{formatFull(q.rewards.hp)}</td>
                    <td className="py-2 pr-3 text-right">
                      {q.rewards.usd ? `$${formatFull(q.rewards.usd)}` : "n/a"}
                    </td>
                    <td className="py-2 pr-3 text-right">{formatFull(q.content.posts)}</td>
                    <td className="py-2 pr-3 text-right">{formatFull(q.content.comments)}</td>
                    <td className="py-2 pr-3 text-right">
                      {q.curation ? formatFull(q.curation.curators) : "n/a"}
                    </td>
                    <td className="py-2 text-right">
                      {q.curation ? formatFull(q.curation.hp) : "n/a"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3">{t("methodology-title")}</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>{t("methodology-1")}</li>
              <li>{t("methodology-2")}</li>
              <li>{t("methodology-3")}</li>
              <li>{t("methodology-4")}</li>
              <li>{t("methodology-5")}</li>
              <li>{t("methodology-6")}</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
