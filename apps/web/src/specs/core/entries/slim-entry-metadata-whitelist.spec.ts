import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { catchPostImage, getEntryCardImageRawUrl } from "@ecency/render-helper";
import { CARD_METADATA_KEYS, slimEntry } from "@/core/entries/slim-entry";
import type { Entry } from "@/entities";
import { mockEntry } from "@/specs/test-utils";

// A feed card reads six json_metadata keys. Everything else an author or a
// publishing client wrote is dead weight in the SSR payload: measured on 80
// live rows (a community `created`, `trending`, a tag `hot` and a photo
// community, 20 each) it was 53% of a slim entry's json_metadata — `links` was
// 12 KB of it, then Liketu's flow/images/image_focus, Actifit's
// detailedActivity/step_count/fitbitUserId, inLeo's hivepro, Waivio's wobj.
// Modelled as an anonymous dehydrated feed page those four feeds went
// 149,031 -> 109,398 bytes (-26.6%); the worst single feed was -40.9%.
//
// The whitelist is only safe while it is a superset of what a card reads, which
// is why the last block re-derives that read set from the card source rather
// than trusting this comment.

let seq = 0;

function entry(overrides: Partial<Entry> = {}): Entry {
  return mockEntry({ permlink: `whitelist-fixture-${++seq}`, ...overrides });
}

/** json_metadata keys seen in the wild that no render in this app reads. */
const AUTHOR_JUNK = {
  links: ["https://a.example/1", "https://a.example/2"],
  links_meta: { "https://a.example/1": { title: "t" } },
  format: "markdown+html",
  canonical_url: "https://inleo.io/@a/p",
  image_ratios: ["1.7778"],
  hivepro: { destination: "inleo", enforcedRules: ["primary-tag:leofinance"] },
  flow: { pictures: [{ id: 1 }] },
  images: ["https://a.example/x.png"],
  image_focus: { "https://a.example/x.png": "50% 50%" },
  detailedActivity: [{ steps: 10 }],
  fitbitUserId: "ABC123",
  wobj: { wobjects: [] }
};

describe("slimEntry keeps only the json_metadata a card reads", () => {
  it("drops every author-written key no render reads", () => {
    const slimmed = slimEntry(entry({ json_metadata: AUTHOR_JUNK as never }));
    for (const key of Object.keys(AUTHOR_JUNK)) {
      expect(slimmed.json_metadata, key).not.toHaveProperty(key);
    }
  });

  it("keeps every key the card itself reads", () => {
    const slimmed = slimEntry(
      entry({
        body: "A body with enough words to summarise into a card line.",
        json_metadata: {
          app: "ecency/4.4.2-vision",
          tags: ["hive-125125", "nsfw"],
          image: ["https://images.hive.blog/cover.png"],
          location: { coordinates: { lat: 1.5, lng: 2.5 }, address: "somewhere" },
          ...AUTHOR_JUNK
        } as never
      })
    );

    expect(slimmed.json_metadata?.app).toBe("ecency/4.4.2-vision");
    expect(slimmed.json_metadata?.tags).toEqual(["hive-125125", "nsfw"]);
    expect(slimmed.json_metadata?.image).toEqual(["https://images.hive.blog/cover.png"]);
    expect(slimmed.json_metadata?.location).toEqual({
      coordinates: { lat: 1.5, lng: 2.5 },
      address: "somewhere"
    });
    expect(slimmed.json_metadata?.description).toBeTruthy();
  });

  // The nsfw gate is `json_metadata.tags.includes("nsfw")` in two card
  // components. A card whose tags went missing would silently un-blur.
  // These two are read by the ENTRY page and the discussion list, not by a card,
  // and the entries cache is shared with both — a feed row seeds the same key an
  // entry page later reads. Dropping them blanks the AI-tools chip and the
  // pinned-reply marker until that page's own fetch resolves, which is exactly
  // the reason the poll keys below are kept too.
  it("keeps the keys a shared-cache consumer reads, even though no card reads them", () => {
    const entry = mockEntry({
      body: "x".repeat(200),
      json_metadata: {
        ai_tools: [{ name: "midjourney" }],
        pinned_reply: "alice/some-reply",
        junk: "dropped"
      }
    } as never);
    const slim = slimEntry(entry as never) as never as { json_metadata: Record<string, unknown> };
    expect(slim.json_metadata.ai_tools).toEqual([{ name: "midjourney" }]);
    expect(slim.json_metadata.pinned_reply).toBe("alice/some-reply");
    expect(slim.json_metadata.junk).toBeUndefined();
  });

  it("keeps the tags the nsfw gate reads", () => {
    const slimmed = slimEntry(entry({ json_metadata: { tags: ["photography", "nsfw"] } }));
    const tags = slimmed.json_metadata?.tags;
    expect(Array.isArray(tags) && tags.includes("nsfw")).toBe(true);
  });

  // A poll card shows only an icon, but the feed row seeds the shared entries
  // cache that the entry page and the edit prefill read, and both rebuild the
  // whole poll from these keys. They exist only on poll posts.
  it("keeps a poll's metadata whole", () => {
    const poll = {
      content_type: "poll",
      version: 1,
      question: "Which one?",
      choices: ["a", "b"],
      preferred_interpretation: "number_of_votes",
      token: "",
      vote_change: true,
      hide_votes: false,
      filters: { account_age: 0 },
      end_time: 1789024808,
      max_choices_voted: 1
    };
    const slimmed = slimEntry(entry({ json_metadata: poll as never }));
    for (const [key, value] of Object.entries(poll)) {
      expect(slimmed.json_metadata?.[key as keyof typeof slimmed.json_metadata], key).toEqual(
        value
      );
    }
  });

  // `thumbnails` is the one dropped key a card path DOES consult: catchPostImage
  // and getEntryCardImageRawUrl read it ahead of `image`. Dropping it is only
  // safe because the slim step already collapsed it into image[0] with the same
  // precedence, so both must still answer with the very same URL.
  it("drops thumbnails without moving the card thumbnail", () => {
    const full = entry({
      json_metadata: {
        thumbnails: ["https://images.hive.blog/thumb.png"],
        image: ["https://images.hive.blog/cover.png"],
        ...AUTHOR_JUNK
      } as never
    });
    const slimmed = slimEntry(full);

    expect(slimmed.json_metadata).not.toHaveProperty("thumbnails");
    expect(getEntryCardImageRawUrl(slimmed)).toBe("https://images.hive.blog/thumb.png");
    expect(catchPostImage(slimmed, 600, 500, "match")).toBe(
      catchPostImage(full, 600, 500, "match")
    );
  });

  it("gives a cross-post's nested original the same treatment", () => {
    const original = entry({ json_metadata: { app: "peakd", ...AUTHOR_JUNK } as never });
    const slimmed = slimEntry(entry({ original_entry: original }));
    expect(slimmed.original_entry?.json_metadata?.app).toBe("peakd");
    expect(slimmed.original_entry?.json_metadata).not.toHaveProperty("links");
  });

  // json_metadata is whatever the publisher wrote and whatever the node hands
  // back. Spreading a raw string used to index it character by character, so a
  // node that skipped parsing produced a metadata object of hundreds of
  // single-character keys.
  it("does not index a string or scalar json_metadata character by character", () => {
    const allowed = new Set<string>(CARD_METADATA_KEYS);
    for (const raw of ['{"tags":["x"]}', 42, true] as never[]) {
      const keys = Object.keys(slimEntry(entry({ json_metadata: raw })).json_metadata ?? {});
      expect(keys).toContain("description");
      expect(
        keys.filter((k) => !allowed.has(k)),
        String(raw)
      ).toEqual([]);
    }
  });
});

// The whitelist is a claim about the card's read set. Re-derive that read set
// from the source so the claim cannot quietly go stale: a card that starts
// reading a seventh key fails here rather than rendering without it in
// production.
const SRC = path.resolve(__dirname, "../../..");
// The card and everything inside it, including the deferred action bar's own
// reader (the translate gate), plus the helpers the card calls out to.
const READERS = [
  "features/shared/entry-list-item",
  "features/shared/entry-translate",
  "core/entries/entry-summary.ts",
  "core/entries/language-hint.ts",
  "utils/use-entry-location.ts"
];

function sourceFiles(rel: string): string[] {
  const target = path.join(SRC, rel);
  if (fs.statSync(target).isFile()) {
    return [target];
  }
  return fs
    .readdirSync(target, { withFileTypes: true, recursive: true } as never)
    .filter((e: fs.Dirent) => e.isFile() && /\.(ts|tsx)$/.test(e.name))
    .map((e: fs.Dirent) => path.join((e as unknown as { parentPath: string }).parentPath, e.name));
}

/** Source with comments removed — prose about a key is not a read of it. */
function read(file: string) {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

// `entry.json_metadata?.app`, `entry.json_metadata.tags` and
// `(entry.json_metadata as any)?.content_type` are all the same read.
const READ_RE = /json_metadata\s*(?:as\s+[\w<>\[\]|. ]+)?\s*\)?\s*\??\.\s*([A-Za-z_$][\w$]*)/g;

describe("the whitelist covers what the card actually reads", () => {
  it("finds the reads it is meant to be checking", () => {
    const keys = new Set<string>();
    for (const rel of READERS) {
      for (const file of sourceFiles(rel)) {
        for (const m of read(file).matchAll(READ_RE)) {
          keys.add(m[1]);
        }
      }
    }
    // Guard against a regex that silently matches nothing: these three are
    // read in plain sight by the card components.
    expect([...keys].sort()).toEqual(expect.arrayContaining(["app", "content_type", "tags"]));
  });

  it("reads no json_metadata key the slim step drops", () => {
    const allowed = new Set<string>(CARD_METADATA_KEYS);
    for (const rel of READERS) {
      for (const file of sourceFiles(rel)) {
        for (const m of read(file).matchAll(READ_RE)) {
          expect(allowed.has(m[1]), `${path.relative(SRC, file)} reads json_metadata.${m[1]}`).toBe(
            true
          );
        }
      }
    }
  });
});
