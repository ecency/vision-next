import fs from "fs";
import path from "path";
import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server.browser";
import { pinnedPermlink } from "@/app/(dynamicPages)/profile/[username]/_helpers/pinned-permlink";
import { profileText } from "@/app/(dynamicPages)/profile/[username]/_components/profile-card/profile-text";
import { profileWebsiteHref } from "@/app/(dynamicPages)/profile/[username]/_components/profile-card/website-href";

// `account.profile` is not validated data. The SDK builds it by JSON.parsing the
// account's `posting_json_metadata` and casting the result
// (parseProfileMetadata -> `parsed.profile as AccountProfile`), so every field
// typed `string` arrives as whatever JSON the account's posting key published.
//
// That mattered less while profile/[username]/loading.tsx wrapped the page in a
// Suspense boundary: the shell had already flushed and only the entries region
// failed. With the boundary gone (#1787) the same throw happens before the
// first flush and takes the whole document, so the reads are guarded at the
// call sites.
const ROUTE = path.resolve(__dirname, "../../app/(dynamicPages)/profile/[username]");
const SDK_POST_QUERY = path.resolve(
  __dirname,
  "../../../../../packages/sdk/src/modules/posts/queries/get-post-query-options.ts"
);

/**
 * Source with comments removed. The call-site checks below assert that a read
 * is GONE from the code; the prose next to each guard names the very read it
 * replaced, and matching that prose would make the check pass for the wrong
 * reason (or fail for no reason at all).
 */
function code(file: string) {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

// Values a hostile or merely sloppy profile can actually carry through
// JSON.parse. `null`/`undefined` are the ordinary "no value" cases; the rest are
// the ones that used to throw.
const HOSTILE_VALUES: [label: string, value: unknown][] = [
  ["number", 123],
  ["boolean", true],
  ["object", { toString: () => "not a string" }],
  ["array", ["a", "b"]],
  ["nested object", { en: "About me" }]
];

describe("pinnedPermlink guards the untrusted profile.pinned read", () => {
  it("passes a real permlink through unchanged", () => {
    expect(pinnedPermlink({ pinned: "my-pinned-post" })).toBe("my-pinned-post");
  });

  it("returns undefined for a missing profile or a missing pinned field", () => {
    expect(pinnedPermlink(undefined)).toBeUndefined();
    expect(pinnedPermlink(null)).toBeUndefined();
    expect(pinnedPermlink({})).toBeUndefined();
  });

  it("returns undefined for an empty or whitespace-only permlink", () => {
    expect(pinnedPermlink({ pinned: "" })).toBeUndefined();
    expect(pinnedPermlink({ pinned: "   " })).toBeUndefined();
  });

  it.each(HOSTILE_VALUES)("returns undefined for a %s pinned value", (_label, value) => {
    expect(pinnedPermlink({ pinned: value } as never)).toBeUndefined();
  });

  // The reason the type test is load-bearing rather than defensive noise: the
  // SDK trims the permlink while BUILDING the options object and again in its
  // `enabled` expression, both outside the queryFn, so `.trim()` runs on
  // whatever the caller hands over before any gate can reject it. That line
  // lives in a package this PR does not change; if it ever grows its own type
  // check, this spec is where the reader finds out the guard's premise moved.
  it("pins the SDK line that makes an unguarded pinned value a throw", () => {
    const sdk = fs.readFileSync(SDK_POST_QUERY, "utf8");
    const build = sdk.indexOf("const cleanPermlink = permlink?.trim();");
    const queryFn = sdk.indexOf("queryFn:");
    expect(build, "eager permlink?.trim() in getPostQueryOptions").toBeGreaterThan(-1);
    expect(build, "the trim runs before the queryFn, not inside it").toBeLessThan(queryFn);
    // `enabled` is evaluated eagerly too, and dereferences permlink directly.
    expect(sdk).toMatch(/enabled:[\s\S]*permlink\.trim\(\)/);
  });

  // The SDK is mocked app-wide in these specs (setup-any-spec replaces
  // getPostQueryOptions with a stub that does not trim), so a rendering test
  // could not observe the throw and would pass with or without the guard.
  // Pin the call sites instead: the raw read must be gone from all three.
  it.each([
    ["page.tsx", path.join(ROUTE, "page.tsx")],
    ["[section]/page.tsx", path.join(ROUTE, "[section]/page.tsx")],
    [
      "_components/profile-entries-list.tsx",
      path.join(ROUTE, "_components/profile-entries-list.tsx")
    ]
  ])("routes the pinned read in %s through the guard", (_label, file) => {
    const source = code(file);
    expect(source).toMatch(/pinnedPermlink\(/);
    // No call site may hand a raw `profile.pinned` to anything again.
    expect(source).not.toMatch(/profile\??\.pinned/);
  });
});

describe("profileText guards the untrusted profile strings the card renders", () => {
  it("leaves strings exactly as they are, empty string included", () => {
    expect(profileText("Alice")).toBe("Alice");
    // Load-bearing: the call sites use `value && ...` and `value ?? fallback`,
    // so normalising "" here would change what renders for real profiles.
    expect(profileText("")).toBe("");
  });

  it("returns undefined for null and undefined", () => {
    expect(profileText(null)).toBeUndefined();
    expect(profileText(undefined)).toBeUndefined();
  });

  it.each(HOSTILE_VALUES)("returns undefined for a %s value", (_label, value) => {
    expect(profileText(value)).toBeUndefined();
  });

  // The hazard itself, on the real renderer: an object in a field typed
  // `string` is not a rendering glitch, it is a throw out of the profile card.
  it("turns a React child that would throw into one that renders nothing", () => {
    const hostile = { en: "About me" } as unknown as string;
    expect(() => renderToStaticMarkup(<div>{hostile}</div>)).toThrow();
    expect(renderToStaticMarkup(<div>{profileText(hostile)}</div>)).toBe("<div></div>");
  });

  it("is what the profile card renders, not the raw profile fields", () => {
    const source = code(path.join(ROUTE, "_components/profile-card/index.tsx"));
    for (const field of ["name", "about", "location", "website"]) {
      expect(source, `profile.${field} rendered raw`).not.toMatch(
        new RegExp(`\\{data\\??\\.?profile\\??\\.${field}\\}`)
      );
    }
    expect(source).toMatch(/profileText\(data\?\.profile\?\.name\)/);
    expect(source).toMatch(/profileText\(data\?\.profile\?\.about\)/);
    expect(source).toMatch(/profileText\(data\?\.profile\?\.location\)/);
    expect(source).toMatch(/profileText\(data\?\.profile\?\.website\)/);
  });
});

describe("profileWebsiteHref survives a non-string website", () => {
  it("still builds an href from a real website string", () => {
    expect(profileWebsiteHref("example.com")).toBe("https://example.com");
  });

  // `.replace` on a number is a TypeError, thrown while rendering the profile
  // card — which the profile LAYOUT renders, above every loading boundary this
  // route has ever had.
  it.each(HOSTILE_VALUES)("returns null instead of throwing for a %s", (_label, value) => {
    expect(() => profileWebsiteHref(value as never)).not.toThrow();
    expect(profileWebsiteHref(value as never)).toBeNull();
  });
});
