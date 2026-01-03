import { BeneficiaryRoute } from "@/entities";
import {
  filterOutThreeSpeakBeneficiaries,
  mergeThreeSpeakBeneficiaries,
  THREE_SPEAK_ENCODER_ACCOUNT,
  THREE_SPEAK_ENCODER_DEFAULT_WEIGHT,
  THREE_SPEAK_ENCODER_SRC
} from "@/features/3speak";

describe("3Speak beneficiaries helpers", () => {
  it("merges encoder beneficiaries with existing ones", () => {
    const existing: BeneficiaryRoute[] = [
      { account: "alice", weight: 500 },
      { account: "encoder-old", weight: 100, src: THREE_SPEAK_ENCODER_SRC }
    ];

    const raw = JSON.stringify([
      { account: "encoder-one", weight: 250, src: THREE_SPEAK_ENCODER_SRC },
      { account: THREE_SPEAK_ENCODER_ACCOUNT, weight: 750 }
    ]);

    const merged = mergeThreeSpeakBeneficiaries(raw, existing);

    expect(merged).toEqual([
      { account: "alice", weight: 500 },
      { account: "encoder-one", weight: 250, src: THREE_SPEAK_ENCODER_SRC },
      { account: THREE_SPEAK_ENCODER_ACCOUNT, weight: 750, src: THREE_SPEAK_ENCODER_SRC }
    ]);
  });

  it("falls back to default encoder beneficiary on invalid payload", () => {
    const merged = mergeThreeSpeakBeneficiaries("not-json", []);

    expect(merged).toEqual([
      {
        account: THREE_SPEAK_ENCODER_ACCOUNT,
        weight: THREE_SPEAK_ENCODER_DEFAULT_WEIGHT,
        src: THREE_SPEAK_ENCODER_SRC
      }
    ]);
  });

  it("filters out encoder beneficiaries", () => {
    const existing: BeneficiaryRoute[] = [
      { account: "alice", weight: 500 },
      { account: THREE_SPEAK_ENCODER_ACCOUNT, weight: 1000, src: THREE_SPEAK_ENCODER_SRC }
    ];

    expect(filterOutThreeSpeakBeneficiaries(existing)).toEqual([{ account: "alice", weight: 500 }]);
  });

  it("filters encoder beneficiaries even when src is missing", () => {
    const existing: BeneficiaryRoute[] = [
      { account: "bob", weight: 250 },
      { account: THREE_SPEAK_ENCODER_ACCOUNT, weight: 1000 }
    ];

    expect(filterOutThreeSpeakBeneficiaries(existing)).toEqual([{ account: "bob", weight: 250 }]);
  });

  it("supports already parsed beneficiaries", () => {
    const existing: BeneficiaryRoute[] = [{ account: "charlie", weight: 200 }];
    const raw = [
      { account: "spk.helper", weight: 250, src: THREE_SPEAK_ENCODER_SRC },
      { account: THREE_SPEAK_ENCODER_ACCOUNT, weight: 700 }
    ];

    const merged = mergeThreeSpeakBeneficiaries(raw, existing);

    expect(merged).toEqual([
      { account: "charlie", weight: 200 },
      { account: "spk.helper", weight: 250, src: THREE_SPEAK_ENCODER_SRC },
      { account: THREE_SPEAK_ENCODER_ACCOUNT, weight: 700, src: THREE_SPEAK_ENCODER_SRC }
    ]);
  });
});
