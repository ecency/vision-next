import getSlug from "speakingurl";

const permlinkRnd = () => (Math.random() + 1).toString(16).substring(2);

export const createPermlink = (title: string, random: boolean = false): string => {
  // Ensure the string is valid and normalized
  let slug = getSlug(title || "", { lang: false, symbols: true }) ?? "";

  // Normalize and remove problematic Unicode characters
  slug = slug
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9 -]/g, "") // Remove emoji and symbols
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-"); // Collapse repeated dashes

  // Fallback if result is empty
  if (!slug || slug.length === 0) {
    return permlinkRnd().toLowerCase();
  }

  const parts = slug.split("-");
  let perm = parts.length > 5 ? parts.slice(0, 5).join("-") : slug;

  if (random) {
    const rnd = permlinkRnd().toLowerCase();
    perm = `${perm}-${rnd}`;
  }

  if (perm.length > 255) {
    perm = perm.substring(0, 250);
  }

  return perm;
};
