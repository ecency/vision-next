import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

/**
 * A key whose English value carries a `{{placeholder}}` must be called with the
 * values that fill it. `i18next.t("profile-info.joined")` with no second
 * argument does not throw and does not fall back: it renders the placeholder
 * verbatim, so the UI shows a literal "Joined: {{n}}".
 *
 * That is how the profile hover card shipped it. `profile-info.joined` is the
 * full sentence the profile page renders ("Joined: 3 years ago", built with
 * `{ n: created }`), but the popover reused it as the *title* of a cell that
 * prints the date underneath, so the label read "JOINED: {{N}}" while the real
 * date sat one line below. Fixed by giving the popover a bare
 * `profile-info.joined-label`.
 *
 * No unit test would have caught it: specs/setup-any-spec.ts mocks i18next so
 * `t()` returns the key verbatim, which means a render assertion sees
 * "profile-info.joined" and never the interpolated value. The check has to run
 * against the source and the real locale table instead.
 *
 * en-US.json is the only locale edited by hand here (Crowdin syncs the rest),
 * so it is the one table worth checking.
 */
const SRC = path.resolve(__dirname, "../../..");
const LOCALE = path.join(SRC, "features/i18n/locales/en-US.json");

/**
 * Call sites that pass no values for a key that needs them, and are still
 * broken. Each renders its placeholders to the user; listing one here pins the
 * bug rather than hiding it. Fix the site, then delete the entry.
 */
const KNOWN_BROKEN: { file: string; key: string }[] = [
  // 402 toast: needs `required` and `available` off the error payload, which
  // the catch block does not read today. Shows "You need {{required}} but have
  // {{available}}." to anyone who runs out of points mid-summarize.
  {
    file: "app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-listen.tsx",
    key: "ai-assist.error-insufficient-points"
  }
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "specs") continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

function lookup(table: unknown, key: string): string | undefined {
  let cur: any = table;
  for (const part of key.split(".")) {
    if (typeof cur !== "object" || cur === null || !(part in cur)) return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

/** `t("some.key")` closed immediately: no values argument follows. */
const BARE_T_CALL = /\bt\(\s*"([a-zA-Z0-9._-]+)"\s*\)/g;

describe("i18n keys that interpolate are called with values", () => {
  const locale = JSON.parse(fs.readFileSync(LOCALE, "utf-8"));

  it("has no un-filled placeholder call sites beyond the known-broken list", () => {
    const found: { file: string; key: string }[] = [];

    for (const file of walk(SRC)) {
      const src = fs.readFileSync(file, "utf-8");
      for (const match of src.matchAll(BARE_T_CALL)) {
        const key = match[1];
        const value = lookup(locale, key);
        if (value && value.includes("{{")) {
          found.push({ file: path.relative(SRC, file), key });
        }
      }
    }

    expect(found).toEqual(KNOWN_BROKEN);
  });

  it("keeps a bare label for the hover card's joined cell", () => {
    // The popover title must not be the interpolated sentence, and the plain
    // label has to exist for it to point at.
    expect(lookup(locale, "profile-info.joined-label")).toBe("Joined");
    expect(lookup(locale, "profile-info.joined")).toContain("{{n}}");

    const preview = fs.readFileSync(
      path.join(SRC, "features/shared/profile-popover/profile-preview/index.tsx"),
      "utf-8"
    );
    expect(preview).toContain('i18next.t("profile-info.joined-label")');
  });
});
