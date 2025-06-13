import getSlug from "speakingurl";
import { diff_match_patch } from "diff-match-patch";
import { BeneficiaryRoute, CommentOptions, MetaData, RewardType } from "@/entities";

const permlinkRnd = () => (Math.random() + 1).toString(16).substring(2);

export const createPermlink = (title: string, random: boolean = false): string => {
  let slug = getSlug(title).toString();

  // normalize early
  slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "");

  // shorten if too long
  const parts = slug.split("-");
  let perm = parts.length > 5 ? parts.slice(0, 5).join("-") : slug;

  if (random) {
    const rnd = permlinkRnd().toLowerCase(); // ensure random part is clean
    perm = `${perm}-${rnd}`;
  }

  // enforce Hive max length
  if (perm.length > 255) {
    perm = perm.substring(0, 250);
  }

  if (perm.length === 0) {
    return permlinkRnd().toLowerCase();
  }

  return perm;
};


export const extractMetaData = (body: string): MetaData => {
  const urlReg = /(\b(https?|ftp):\/\/[A-Z0-9+&@#/%?=~_|!:,.;-]*[-A-Z0-9+&@#/%=~_|])/gim;
  const imgReg = /(https?:\/\/.*\.(?:tiff?|jpe?g|gif|png|svg|ico|heic|webp))/gim;

  const out: MetaData = {};
  const mUrls = body.match(urlReg);

  const matchedImages = [];

  if (mUrls) {
    for (let i = 0; i < mUrls.length; i++) {
      const ind = mUrls[i].match(imgReg);
      if (ind) {
        matchedImages.push(mUrls[i]);
      }
    }
  }

  if (matchedImages.length) {
    out.image = matchedImages.slice(0, 10);
    out.thumbnails = matchedImages;
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
): CommentOptions => {
  beneficiaries?.forEach((b) => delete b.src);

  beneficiaries?.sort((a, b) => a.account.localeCompare(b.account));
  const opt: CommentOptions = {
    allow_curation_rewards: true,
    allow_votes: true,
    author,
    permlink,
    max_accepted_payout: "1000000.000 HBD",
    percent_hbd: 10000,
    extensions:
      beneficiaries && beneficiaries.length > 0 ? [[0, { beneficiaries: beneficiaries }]] : []
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
