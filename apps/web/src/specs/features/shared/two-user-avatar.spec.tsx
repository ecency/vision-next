import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TwoUserAvatar } from "@/features/shared/two-user-avatar";
import defaults from "@/defaults";

// Derive from the same source the component reads (defaults.imageServer is
// env-overridable via NEXT_PUBLIC_IMAGE_SERVER) so the URL assertions hold
// regardless of the CI environment.
const IMAGE_SERVER = defaults.imageServer;

/**
 * TwoUserAvatar renders two stacked avatar spans whose backgroundImage is built
 * from `defaults.imageServer`, the `from`/`to` usernames and a size-mapped
 * image size segment. There is no text content, so behavior is asserted via the
 * inline backgroundImage style of each span.
 */
describe("TwoUserAvatar", () => {
  function renderAvatars(props: { from: string; to: string; size?: string }) {
    const { container } = render(<TwoUserAvatar {...props} />);
    const spans = Array.from(container.querySelectorAll("span"));
    return { container, spans };
  }

  it("renders exactly two avatar spans", () => {
    const { spans } = renderAvatars({ from: "alice", to: "bob" });
    expect(spans).toHaveLength(2);
  });

  it("builds the first span image from the `from` username", () => {
    const { spans } = renderAvatars({ from: "alice", to: "bob" });
    expect(spans[0].style.backgroundImage).toBe(
      `url("${IMAGE_SERVER}/u/alice/avatar/medium")`
    );
  });

  it("builds the second span image from the `to` username", () => {
    const { spans } = renderAvatars({ from: "alice", to: "bob" });
    expect(spans[1].style.backgroundImage).toBe(
      `url("${IMAGE_SERVER}/u/bob/avatar/medium")`
    );
  });

  it("uses distinct usernames for each avatar (no cross-talk)", () => {
    const { spans } = renderAvatars({ from: "alice", to: "bob" });
    expect(spans[0].style.backgroundImage).toContain("/u/alice/");
    expect(spans[0].style.backgroundImage).not.toContain("/u/bob/");
    expect(spans[1].style.backgroundImage).toContain("/u/bob/");
    expect(spans[1].style.backgroundImage).not.toContain("/u/alice/");
  });

  it("maps size 'xLarge' to the 'large' image segment", () => {
    const { spans } = renderAvatars({ from: "alice", to: "bob", size: "xLarge" });
    expect(spans[0].style.backgroundImage).toBe(
      `url("${IMAGE_SERVER}/u/alice/avatar/large")`
    );
    expect(spans[1].style.backgroundImage).toBe(
      `url("${IMAGE_SERVER}/u/bob/avatar/large")`
    );
  });

  it("maps size 'normal' and 'small' to the 'small' image segment", () => {
    const normal = renderAvatars({ from: "alice", to: "bob", size: "normal" });
    expect(normal.spans[0].style.backgroundImage).toBe(
      `url("${IMAGE_SERVER}/u/alice/avatar/small")`
    );

    const small = renderAvatars({ from: "carol", to: "dave", size: "small" });
    expect(small.spans[1].style.backgroundImage).toBe(
      `url("${IMAGE_SERVER}/u/dave/avatar/small")`
    );
  });

  it("defaults unknown/omitted sizes to the 'medium' image segment", () => {
    const unknown = renderAvatars({ from: "alice", to: "bob", size: "whatever" });
    expect(unknown.spans[0].style.backgroundImage).toContain("/avatar/medium");
  });

  it("applies the size to the className of both spans", () => {
    const { spans } = renderAvatars({ from: "alice", to: "bob", size: "xLarge" });
    spans.forEach((span) => {
      expect(span).toHaveClass("two-user-avatar");
      expect(span).toHaveClass("xLarge");
    });
  });
});
