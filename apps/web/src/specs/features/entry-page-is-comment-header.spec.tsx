import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Entry } from "@/entities";
import { EntryPageIsCommentHeader } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-is-comment-header";

// A comment entry: chain-provided `url` points at the ROOT discussion with a
// fragment to the comment (category-prefixed legacy form). `author`/`permlink`
// identify the comment itself.
const commentEntry = {
  category: "esteem",
  author: "forykw",
  permlink: "re-esteemapp-202067t12246786z",
  parent_author: "esteemapp",
  parent_permlink: "esteem-discord-monthly-giveaway-winners-21",
  depth: 1,
  title: "Re: winners",
  url: "/esteem/@esteemapp/esteem-discord-monthly-giveaway-winners-21#@forykw/re-esteemapp-202067t12246786z"
} as unknown as Entry;

describe("EntryPageIsCommentHeader", () => {
  it("links 'go to root' to the bare root-discussion URL, not the comment itself", () => {
    const { getByText } = render(<EntryPageIsCommentHeader entry={commentEntry} />);
    // i18next is mocked to return keys as-is in specs.
    const rootLink = getByText("entry.comment-entry-go-root").closest("a");

    // Targets the ROOT post (+ comment anchor) in the bare canonical form —
    // the leading /esteem category segment is stripped to avoid the 308 hop.
    expect(rootLink?.getAttribute("href")).toBe(
      "/@esteemapp/esteem-discord-monthly-giveaway-winners-21#@forykw/re-esteemapp-202067t12246786z"
    );
    // Regression guard: must NOT collapse to the comment's own page.
    expect(rootLink?.getAttribute("href")).not.toBe("/@forykw/re-esteemapp-202067t12246786z");
  });
});
