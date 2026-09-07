import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommentPayload } from "@ecency/sdk";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { createTestQueryClient, mockEntry, mockFullAccount } from "@/specs/test-utils";

// The wave submit captures whatever the SDK comment mutation is handed. That
// payload IS the transaction, so asserting on it is asserting on what the chain
// receives.
const { sdkComment } = vi.hoisted(() => ({ sdkComment: vi.fn(async () => ({ id: "tx-1" })) }));

vi.mock("@/api/sdk-mutations", () => ({
  useCommentMutation: () => ({ mutateAsync: sdkComment })
}));

// The global @ecency/sdk stub does not carry these; the create path awaits
// propagation and writes the discussions cache, neither of which this spec is
// about.
vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
  validatePostCreating: vi.fn(async () => true),
  getAccountFullQueryOptions: vi.fn(() => ({ queryKey: ["account"], queryFn: vi.fn() })),
  getDiscussionsQueryOptions: vi.fn(() => ({ queryKey: ["posts", "discussions"] })),
  SortOrder: { created: "created" }
}));

// Fire-and-forget 3Speak linking; it already refuses to run on an edit.
vi.mock("@/api/threespeak-embed/link-after-broadcast", () => ({
  linkThreeSpeakEmbed: vi.fn()
}));

// The global @/utils mock replaces the module wholesale; restore the real
// permlink/entry helpers this hook builds its payload with.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// Cache bookkeeping runs after the broadcast and is not what this spec pins.
vi.mock("@/core/caches", () => ({
  EcencyEntriesCacheManagement: {
    useUpdateRepliesCount: () => ({ updateRepliesCount: vi.fn() }),
    updateEntryQueryData: vi.fn()
  }
}));

import { useWavesApi } from "@/features/waves/components/wave-form/api/use-waves-api";

const THREESPEAK_BODY =
  "Shocking Joking\nhttps://play.3speak.tv/embed?v=seckorama/s8kerolu";

/** The wave container post a wave is published under. */
const container = mockEntry({ author: "ecency.waves", permlink: "waves-20260906" });

/** The already-published wave being edited. It carries beneficiaries on chain. */
const publishedWave = mockEntry({
  author: "seckorama",
  permlink: "wave-202697t01155190z",
  parent_author: "ecency.waves",
  parent_permlink: "waves-20260906",
  body: THREESPEAK_BODY
});

function wrapper({ children }: { children: ReactNode }) {
  const client = createTestQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Runs the mutation and returns the payload the SDK comment mutation received. */
async function broadcast(vars: Record<string, unknown>): Promise<CommentPayload> {
  const { result } = renderHook(() => useWavesApi(), { wrapper });
  await result.current.mutateAsync(vars as never);
  await waitFor(() => expect(sdkComment).toHaveBeenCalled());
  return sdkComment.mock.calls.at(-1)![0] as CommentPayload;
}

describe("useWavesApi beneficiaries", () => {
  beforeEach(() => {
    sdkComment.mockClear();
    vi.mocked(useActiveAccount).mockReturnValue({
      username: "seckorama",
      account: mockFullAccount({ name: "seckorama" }),
      isLoading: false
    } as never);
  });

  it("sends no comment options when editing a wave that carries a 3Speak embed", async () => {
    // The reported bug. Beneficiaries are written once, by the transaction that
    // publishes the wave, so rebuilding them from the body on an edit made the
    // node reject the whole transaction with "Comment already has beneficiaries
    // specified." — taking the body edit down with it.
    const payload = await broadcast({
      entry: container,
      raw: `${THREESPEAK_BODY}\nAnimated LMAC253 collage (GrokImagine)`,
      editingEntry: publishedWave,
      host: "ecency.waves"
    });

    expect(payload).not.toHaveProperty("options");
    expect(payload.permlink).toBe("wave-202697t01155190z");
    expect(payload.isUpdate).toBe(true);
  });

  it("keeps meme attribution metadata on an edit while still sending no options", async () => {
    // The guard covers the beneficiaries and nothing else: json_metadata is
    // freely editable on chain, so widening it up to the metadata builder would
    // strip attribution from every edited meme wave.
    const payload = await broadcast({
      entry: container,
      raw: `${THREESPEAK_BODY}\n#decentmemes meme`,
      editingEntry: publishedWave,
      host: "ecency.waves",
      isReply: true,
      decentMemes: {
        templateIds: ["tpl-1"],
        beneficiaries: [{ account: "memecreator", weight: 500 }]
      }
    });

    expect(payload).not.toHaveProperty("options");
    expect(JSON.stringify(payload.jsonMetadata)).toContain("tpl-1");
  });

  it("still attaches the 3Speak beneficiary when publishing a new wave", async () => {
    const payload = await broadcast({
      entry: container,
      raw: THREESPEAK_BODY,
      host: "ecency.waves"
    });

    expect(payload.options?.beneficiaries).toEqual([
      { account: "threespeakfund", weight: 1100 }
    ]);
    expect(payload.isUpdate).toBe(false);
  });

  it("still attaches the meme beneficiaries when publishing a new meme wave", async () => {
    const payload = await broadcast({
      entry: container,
      raw: "fresh meme",
      host: "ecency.waves",
      decentMemes: {
        templateIds: ["tpl-1"],
        beneficiaries: [{ account: "memecreator", weight: 500 }]
      }
    });

    expect(payload.options?.beneficiaries).toContainEqual({
      account: "memecreator",
      weight: 500
    });
    expect(payload.isUpdate).toBe(false);
  });

  it("sends no comment options when editing an ordinary wave", async () => {
    const payload = await broadcast({
      entry: container,
      raw: "just adding the credits I forgot",
      editingEntry: mockEntry({
        author: "seckorama",
        permlink: "wave-plain",
        parent_author: "ecency.waves",
        parent_permlink: "waves-20260906"
      }),
      host: "ecency.waves"
    });

    expect(payload).not.toHaveProperty("options");
    expect(payload.isUpdate).toBe(true);
  });
});
