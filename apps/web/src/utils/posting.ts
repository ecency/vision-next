import getSlug from "speakingurl";
import { diff_match_patch } from "diff-match-patch";
import { BeneficiaryRoute, CommentOptions, MetaData, RewardType } from "@/entities";

const permlinkRnd = () => (Math.random() + 1).toString(16).substring(2);

const permlinkPattern = /^[a-z0-9-]{1,255}$/;

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

export const ensureValidPermlink = (
  permlink: string,
  fallbackTitle: string
): string => {
  const normalizedPermlink = permlink?.trim().toLowerCase();

  if (normalizedPermlink && permlinkPattern.test(normalizedPermlink)) {
    return normalizedPermlink;
  }

  const derivedPermlink = createPermlink(permlink || fallbackTitle);

  if (permlinkPattern.test(derivedPermlink)) {
    return derivedPermlink;
  }

  return createPermlink(fallbackTitle, true);
};


export const extractMetaData = (body: string, initialMeta: MetaData = {}): MetaData => {
  // Match images with common file extensions (including RAW formats like .arw)
  const imgReg = /https?:\/\/[^\s"']+\.(?:tiff?|jpe?g|gif|png|svg|ico|heic|webp|arw)/gi;

  // Match images.ecency.com URLs (which may not have file extensions)
  const ecencyImgReg = /https?:\/\/images\.ecency\.com\/(?:(?:p|DQm[a-zA-Z0-9]+)\/)?[^\s"'<>]+/gi;

  const bodyImagesWithExt = body.match(imgReg) || [];
  const ecencyImages = body.match(ecencyImgReg) || [];
  const bodyImages = [...bodyImagesWithExt, ...ecencyImages];

  const existingImages = initialMeta.image ?? [];
  const existingThumbnails = initialMeta.thumbnails ?? [];

  const allImages = Array.from(new Set([...existingImages, ...bodyImages]));

  const out: MetaData = { ...initialMeta };

  if (allImages.length > 0) {
    out.image = allImages.slice(0, 10);
    out.thumbnails = Array.from(
        new Set([...existingThumbnails, ...existingImages, ...bodyImages])
    );
  }

  return out;
};

export const makeApp = (appVer: string) => `ecency/${appVer}-vision`;

export const makeJsonMetaData = (
  meta: MetaData,
  tags: string[],
  description: string | null,
  appVer: string
): MetaData =>
  Object.assign({}, meta, {
    tags,
    description,
    app: makeApp(appVer),
    format: "markdown+html"
  });

export const makeJsonMetaDataReply = (tags: string[], appVer: string) => ({
  tags,
  app: makeApp(appVer),
  format: "markdown+html"
});

export const makeCommentOptions = (
  author: string,
  permlink: string,
  rewardType: RewardType,
  beneficiaries?: BeneficiaryRoute[]
): CommentOptions | null => {
  const sanitizedBeneficiaries = beneficiaries?.map(({ src: _src, ...route }) => ({
    ...route
  }));

  const hasBeneficiaries =
    !!sanitizedBeneficiaries && sanitizedBeneficiaries.length > 0;

  if (!hasBeneficiaries && rewardType === "default") {
    return null;
  }

  const sortedBeneficiaries = sanitizedBeneficiaries
    ? [...sanitizedBeneficiaries].sort((a, b) =>
        a.account.localeCompare(b.account)
      )
    : undefined;
  const opt: CommentOptions = {
    allow_curation_rewards: true,
    allow_votes: true,
    author,
    permlink,
    max_accepted_payout: "1000000.000 HBD",
    percent_hbd: 10000,
    extensions: hasBeneficiaries ? [[0, { beneficiaries: sortedBeneficiaries! }]] : []
  };

  switch (rewardType) {
    case "sp":
      opt.max_accepted_payout = "1000000.000 HBD";
      opt.percent_hbd = 0;
      break;
    case "dp":
      opt.max_accepted_payout = "0.000 HBD";
      opt.percent_hbd = 10000;
      break;
    case "default":
      opt.max_accepted_payout = "1000000.000 HBD";
      opt.percent_hbd = 10000;
      break;
  }

  return opt;
};

export const createReplyPermlink = (toAuthor?: string) => {
  const t = new Date(Date.now());

  const timeFormat = `${t.getFullYear().toString()}${(t.getMonth() + 1).toString()}${t
    .getDate()
    .toString()}t${t.getHours().toString()}${t.getMinutes().toString()}${t
    .getSeconds()
    .toString()}${t.getMilliseconds().toString()}z`;

  return `re-${toAuthor?.replace(/\./g, "")}-${timeFormat}`;
};

export function createWavePermlink() {
  const t = new Date(Date.now());

  const timeFormat = `${t.getFullYear().toString()}${(t.getMonth() + 1).toString()}${t
    .getDate()
    .toString()}t${t.getHours().toString()}${t.getMinutes().toString()}${t
    .getSeconds()
    .toString()}${t.getMilliseconds().toString()}z`;

  return `wave-${timeFormat}`;
}

export const createPatch = (text1: string, text2: string): string | undefined => {
  const dmp = new diff_match_patch();
  if (text1 === "") return undefined;
  const patches = dmp.patch_make(text1, text2);
  return dmp.patch_toText(patches);
};
