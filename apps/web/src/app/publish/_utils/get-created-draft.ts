import { Draft } from "@/entities";

export function getCreatedDraft(previousDrafts: Draft[], nextDrafts: Draft[]) {
  const previousIds = new Set(previousDrafts.map(({ _id }) => _id));
  const insertedDraft = nextDrafts.find(({ _id }) => !previousIds.has(_id));

  if (insertedDraft) {
    return insertedDraft;
  }

  return [...nextDrafts].sort((left, right) => right.timestamp - left.timestamp)[0];
}
