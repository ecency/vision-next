import Link from "next/link";
import i18next from "i18next";

// Evergreen, well-populated topics. These are crawler hub links: server-rendered
// anchors from the homepage into trending tag feeds, communities, and discover —
// so the site's highest-authority page funnels crawl budget into deep content.
const TOPICS = [
  "hive",
  "photography",
  "art",
  "life",
  "travel",
  "food",
  "gaming",
  "music",
  "technology",
  "news",
  "nature",
  "sports"
];

export function LandingExplore() {
  return (
    <section className="sections landing-explore relative z-[2]" aria-labelledby="explore-heading">
      <div className="inner max-w-[1200px] mx-auto w-full px-4 py-10">
        <h2 id="explore-heading" className="text-2xl md:text-3xl font-bold mb-6">
          {i18next.t("landing-page.explore-topics")}
        </h2>
        <ul className="flex flex-wrap gap-2 p-0 m-0 list-none">
          {TOPICS.map((tag) => (
            <li key={tag}>
              <Link
                href={`/trending/${tag}`}
                className="inline-block rounded-full border border-[--border-color] px-4 py-2 hover:bg-blue-dark-sky hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-4 mt-6">
          <Link href="/communities" className="link-read-more">
            {i18next.t("landing-page.popular-communities")}
          </Link>
          <Link href="/discover" className="link-read-more">
            {i18next.t("landing-page.discover")}
          </Link>
        </div>
      </div>
    </section>
  );
}
