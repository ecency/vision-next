import { describe, expect, it } from "vitest";
import { ICONS } from "@/app/decks/_components/consts/column-icons";
import { userTitles } from "@/app/decks/_components/consts/column-titles";
import {
  COMMUNITY_CONTENT_TYPES,
  NOTIFICATION_CONTENT_TYPES,
  USER_CONTENT_TYPES
} from "@/app/decks/_components/consts/content-types";

describe("decks column consts", () => {
  it("titles every user content type, including feeds", () => {
    // The viewer's back button reads `@alice(undefined)` for any unmapped type.
    for (const { type } of USER_CONTENT_TYPES) {
      expect(userTitles[type], `missing title for user content type "${type}"`).toBeDefined();
    }
  });

  it("gives every community and notification content type its own icon", () => {
    for (const { type } of COMMUNITY_CONTENT_TYPES) {
      expect(ICONS.co[type], `missing icon for community content type "${type}"`).toBeDefined();
    }
    for (const { type } of NOTIFICATION_CONTENT_TYPES) {
      expect(ICONS.n[type], `missing icon for notification content type "${type}"`).toBeDefined();
    }
  });

  it("does not show the muted icon for the community 'New' column", () => {
    // "New" is typed "created", which used to resolve to the muted icon.
    expect(ICONS.co.created).not.toBe(ICONS.co.muted);
  });
});
