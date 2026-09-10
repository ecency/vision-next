import React from "react";
import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";
import { makeOverlay, makeRow } from "./curation-test-utils";
import { CurationMarkBadges } from "@/features/curation-desk/curation-mark-badges";
import catalog from "@/features/i18n/locales/en-US.json";

// The global setup replaces @ecency/sdk wholesale, and the badges call the flag
// helpers during render, so hand out the real ones the way the setup does for
// the moderation rules.
vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
}));

/**
 * Every excluded reason `curation.candidates.excluded_reason` can hold, from the
 * desk's own `EXCLUDED_PRIORITY` (esync-py `curation/constants.py`), in its order.
 * The desk decides what leaves the queue; the web only has to be able to SAY why,
 * on the roster excluded lens where a mod audits the removal.
 */
const REASONS = [
  "deleted",
  "abuser",
  "ignorelist",
  "blocked_app",
  "nsfw",
  "blocked_tag",
  "patch_body",
  "rep_negative",
  "rep_low",
] as const;

const badgeProps = {
  isRoster: true,
  reviewedByCursor: false,
  late: false,
  resurfaced: false,
  belowCursor: false,
  chronological: true,
};

function renderChip(excluded_reason: string, isRoster = true) {
  const row = makeRow({ post_id: 1, overlay: makeOverlay({ excluded_reason }) });
  return renderWithQueryClient(
    <CurationMarkBadges row={row} {...badgeProps} isRoster={isRoster} />
  );
}

describe("excluded reason chip", () => {
  // i18next is globally mocked to hand back the key, so this pins the key the
  // component BUILDS from the server's reason. It cannot see whether that key
  // exists, which is what the catalog test below is for.
  it("names every reason the desk can send", () => {
    for (const reason of REASONS) {
      const { getByText, unmount } = renderChip(reason);
      expect(getByText(`curation-desk.excluded-reasons.${reason}`)).toBeInTheDocument();
      unmount();
    }
  });

  it("shows no reason at all on a public row", () => {
    renderChip("nsfw", false);
    expect(screen.queryByText("curation-desk.excluded-reasons.nsfw")).toBeNull();
    expect(screen.queryByText("curation-desk.marks.excluded")).toBeNull();
  });

  /**
   * The chip falls back to `marks.excluded` with the RAW reason interpolated, so a
   * missing entry does not throw and does not fail the render test above: it just
   * reads "excluded: nsfw" to the mod. This is the only thing that catches that,
   * and it catches the next reason the desk adds without a label too.
   */
  it("has an English label for every reason the desk can send", () => {
    const labels = (catalog as Record<string, Record<string, Record<string, string>>>)[
      "curation-desk"
    ]["excluded-reasons"];
    for (const reason of REASONS) {
      expect(typeof labels[reason], reason).toBe("string");
      expect(labels[reason].length, reason).toBeGreaterThan(0);
    }
    // and nothing is labelled that the desk cannot send, so a renamed reason is
    // not left behind as a label nobody reads
    expect(Object.keys(labels).sort()).toEqual([...REASONS].sort());
  });
});
