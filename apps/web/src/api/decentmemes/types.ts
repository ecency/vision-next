// The DecentMemes attribution shapes live in `entities` (the lower layer that
// `entities/private-api/drafts.ts` also depends on) to avoid an entities -> api
// cycle. Re-exported here so callers can keep importing from `@/api/decentmemes`.
export type { DecentMemesEntry, DecentMemesPayload } from "@/entities";
