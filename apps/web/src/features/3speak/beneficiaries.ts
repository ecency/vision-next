import { BeneficiaryRoute } from "@/entities";

export const THREE_SPEAK_ENCODER_SRC = "ENCODER_PAY";
export const THREE_SPEAK_ENCODER_ACCOUNT = "spk.beneficiary";
export const THREE_SPEAK_ENCODER_DEFAULT_WEIGHT = 1000;

function normalizeWeight(weight: unknown): number | null {
  if (typeof weight === "number" && Number.isFinite(weight)) {
    return Math.round(weight);
  }

  if (typeof weight === "string") {
    const parsed = Number.parseInt(weight, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

type RawThreeSpeakBeneficiary = {
  account?: unknown;
  weight?: unknown;
  src?: unknown;
};

function parseRawThreeSpeakBeneficiaries(raw: unknown): BeneficiaryRoute[] {
  if (!raw) {
    return [];
  }

  let normalized: RawThreeSpeakBeneficiary[] | null = null;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        normalized = parsed as RawThreeSpeakBeneficiary[];
      }
    } catch (e) {
      return [];
    }
  } else if (Array.isArray(raw)) {
    normalized = raw as RawThreeSpeakBeneficiary[];
  }

  if (!normalized) {
    return [];
  }

  return normalized
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const account = (item as RawThreeSpeakBeneficiary).account;
        const weight = normalizeWeight((item as RawThreeSpeakBeneficiary).weight);
        const src = (item as RawThreeSpeakBeneficiary).src;

        if (typeof account !== "string" || !account || weight === null) {
          return null;
        }

        const route: BeneficiaryRoute = {
          account,
          weight
        };

        if (typeof src === "string" && src) {
          route.src = src;
        }

        return route;
      })
      .filter((item): item is BeneficiaryRoute => item !== null);
}

function isThreeSpeakEncoderRoute(route: BeneficiaryRoute): boolean {
  return (
    route.account === THREE_SPEAK_ENCODER_ACCOUNT || route.src === THREE_SPEAK_ENCODER_SRC
  );
}

function buildThreeSpeakEncoderBeneficiaries(raw: unknown): BeneficiaryRoute[] {
  const parsed = parseRawThreeSpeakBeneficiaries(raw);
  const unique = new Map<string, BeneficiaryRoute>();

  parsed.forEach((route) => {
    unique.set(route.account, {
      account: route.account,
      weight: route.weight,
      src: route.src ?? THREE_SPEAK_ENCODER_SRC
    });
  });

  const encoderRoute = unique.get(THREE_SPEAK_ENCODER_ACCOUNT);

  unique.set(THREE_SPEAK_ENCODER_ACCOUNT, {
    account: THREE_SPEAK_ENCODER_ACCOUNT,
    weight: encoderRoute?.weight ?? THREE_SPEAK_ENCODER_DEFAULT_WEIGHT,
    src: THREE_SPEAK_ENCODER_SRC
  });

  return Array.from(unique.values());
}

export function filterOutThreeSpeakBeneficiaries(
  existing: BeneficiaryRoute[] | undefined
): BeneficiaryRoute[] {
  if (!existing || existing.length === 0) {
    return [];
  }

  return existing.filter((route) => !isThreeSpeakEncoderRoute(route));
}

export function mergeThreeSpeakBeneficiaries(
  raw: unknown,
  existing: BeneficiaryRoute[] | undefined
): BeneficiaryRoute[] {
  const filteredExisting = filterOutThreeSpeakBeneficiaries(existing);
  const encoderBeneficiaries = buildThreeSpeakEncoderBeneficiaries(raw);

  return [...filteredExisting, ...encoderBeneficiaries];
}
