import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getSafeChatImageUrl, useMessageRendering } from "@/features/chat/hooks/use-message-rendering";

vi.mock("@/features/chat/components/chat-image", () => ({
  ChatImage: ({ src, alt }: { src: string; alt?: string }) => (
    <img data-testid="chat-image" src={src} alt={alt ?? "Shared image"} />
  )
}));

vi.mock("@/features/chat/components/mention-token", () => ({
  MentionToken: ({ username }: { username: string }) => <span>@{username}</span>
}));

vi.mock("@/features/post-renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/post-renderer")>();

  return {
    ...actual,
    HivePostLinkRenderer: ({ link }: { link: string }) => <span>{link}</span>,
  };
});

describe("useMessageRendering", () => {
  const hookProps = {
    usersById: {},
    usersByUsername: {},
    activeUsername: undefined,
    startDirectMessage: vi.fn(),
    normalizeUsername: vi.fn()
  };

  it("proxies markdown image URLs instead of loading them directly", () => {
    const { result } = renderHook(() => useMessageRendering(hookProps));

    render(<div>{result.current.renderMessageContent("![](https://webhook.site/146b640e-078b-45c4-b0d7-9d197acb90b9/gif)")}</div>);

    const image = screen.getByTestId("chat-image");
    expect(image.getAttribute("src")).toBeTruthy();
    expect(image.getAttribute("src")).toContain("https://images.ecency.com/p/");
    expect(image.getAttribute("src")).not.toContain("webhook.site/146b640e-078b-45c4-b0d7-9d197acb90b9/gif");
  });

  it("drops invalid image sources instead of rendering raw img tags", () => {
    const { result } = renderHook(() => useMessageRendering(hookProps));

    render(<div>{result.current.renderMessageContent("<img src=\"x\" alt=\"x\" />")}</div>);

    expect(screen.queryByTestId("chat-image")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("getSafeChatImageUrl", () => {
  it("returns a proxied URL for absolute http image candidates", () => {
    const proxied = getSafeChatImageUrl("https://webhook.site/146b640e-078b-45c4-b0d7-9d197acb90b9/gif");

    expect(proxied).toContain("https://images.ecency.com/p/");
    expect(proxied).not.toContain("webhook.site/146b640e-078b-45c4-b0d7-9d197acb90b9/gif");
  });

  it("rejects non-http image sources", () => {
    expect(getSafeChatImageUrl("x")).toBeNull();
    expect(getSafeChatImageUrl("javascript:alert(1)")).toBeNull();
  });
});
