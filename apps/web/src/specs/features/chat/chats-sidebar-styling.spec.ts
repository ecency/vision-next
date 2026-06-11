import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard for the chats left-pane "3-dot menu is invisible / can't be
 * found" bug.
 *
 * The root causes were *phantom* styling that produces NO CSS at runtime:
 *   1. The per-channel kebab trigger was a bare `gray-link` icon (text-gray-600,
 *      ~3.7:1 on the dark rail) with no hover/focus surface, so users could not
 *      find it.
 *   2. The active/hover channel highlight used Tailwind palette keys that do not
 *      exist in this project's config (`blue-50`, `blue-500`, `blue-600`,
 *      `blue-900`) — they emit zero CSS, so active channels looked inactive.
 *   3. The whole chat feature relies on CSS custom properties
 *      (`--surface-color`, `--text-muted`, ...) that were defined nowhere, so
 *      surfaces/badges fell back to transparent/inherited values.
 *
 * These are asserted at the source/theme level on purpose: jsdom does not
 * compile Tailwind or resolve `var(--x)`, so a rendered-DOM test would happily
 * pass with phantom classes and undefined variables (the className strings still
 * exist, they just paint nothing). A contract test on the source is the only
 * automatable guard that actually catches a reintroduction.
 */

const here = dirname(fileURLToPath(import.meta.url));
const webSrc = resolve(here, "../../..");

const read = (relativeToSrc: string) => readFileSync(resolve(webSrc, relativeToSrc), "utf8");

const chatsClient = read("app/chats/_components/chats-client.tsx");
const themeNight = read("styles/theme-night.scss");
const themeDay = read("styles/theme-day.scss");

describe("chats sidebar styling", () => {
  // Tailwind keys that do NOT exist in this project's palette (tailwind.config.ts
  // replaces the default colors and only defines named blue keys like
  // `blue-dark-sky`). Any of these emit no CSS and must never come back.
  const phantomTailwindKeys = [
    "bg-blue-50",
    "border-blue-500",
    "border-blue-600",
    "bg-blue-900",
    "text-blue-500",
    "text-blue-600"
  ];

  it.each(phantomTailwindKeys)(
    "does not use the non-existent Tailwind key %s",
    (key) => {
      expect(chatsClient).not.toContain(key);
    }
  );

  it("gives the kebab trigger a discoverable affordance (visible in dark mode + hover/focus surface)", () => {
    // The kebab keeps appearance="gray-link" but must add real chrome.
    expect(chatsClient).toContain("dark:text-gray-300");
    expect(chatsClient).toContain("dark:hover:bg-dark-default");
    expect(chatsClient).toContain("focus-visible:ring");
    // The shared class is applied to the menu buttons.
    expect(chatsClient).toContain("className={KEBAB_BUTTON_CLASS}");
  });

  it("highlights the active channel with real palette tokens", () => {
    expect(chatsClient).toContain("border-blue-dark-sky bg-blue-duck-egg dark:bg-dark-default");
    expect(chatsClient).toContain("hover:border-blue-dark-sky");
  });

  // The chat feature consumes these custom properties; they must be defined in
  // BOTH themes or the sidebar renders without surfaces/muted text/badges.
  const requiredChatTokens = [
    "--surface-color",
    "--background-color",
    "--text-color",
    "--text-muted",
    "--primary-color",
    "--primary-button-text-color",
    "--hover-color"
  ];

  it.each(requiredChatTokens)("defines %s in the dark theme", (token) => {
    expect(themeNight).toContain(`${token}:`);
  });

  it.each(requiredChatTokens)("defines %s in the light theme", (token) => {
    expect(themeDay).toContain(`${token}:`);
  });
});
