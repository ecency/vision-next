// Shared between the lightweight (un-armed) author label and the heavy hover
// card so the label renders identically before and after the Popover mounts —
// no layout shift when the card arms on hover.
export const PROFILE_POPOVER_AUTHOR_CLASS =
  "notranslate relative hover:bg-gray-200 font-bold dark:hover:bg-gray-800 rounded-2xl px-2 pointer duration-300";
