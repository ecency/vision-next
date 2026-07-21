import { cleanupModalContainers, setupModalContainers } from "@/specs/test-utils";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const uploadMock = vi.fn(async () => ({ url: "https://images.ecency.com/p/uploaded" }));

vi.mock("@/api/sdk-mutations", () => ({
  useUploadImageMutation: () => ({ mutateAsync: uploadMock })
}));

vi.mock("@/app/publish/_hooks", () => ({
  useOptionalUploadTracker: () => undefined
}));

import { EcencyImagesUploadDialog } from "@/features/ecency-images";

function pickFiles(container: HTMLElement, files: File[]) {
  const input = container.ownerDocument.querySelector(
    "input[type=file]"
  ) as HTMLInputElement | null;
  expect(input).not.toBeNull();
  fireEvent.change(input!, { target: { files } });
}

const jpeg = (name: string) => new File(["x"], name, { type: "image/jpeg" });

describe("EcencyImagesUploadDialog", () => {
  beforeEach(() => {
    setupModalContainers();
    uploadMock.mockClear();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanupModalContainers();
  });

  it("uploads a single picked image without a review step", async () => {
    const onPick = vi.fn();
    const setShow = vi.fn();
    const { container } = render(
      <EcencyImagesUploadDialog show={true} setShow={setShow} onPick={onPick} />
    );

    pickFiles(container, [jpeg("one.jpg")]);

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onPick).toHaveBeenCalledWith("https://images.ecency.com/p/uploaded"));
    // The dialog closes itself once the only image is in
    await waitFor(() => expect(setShow).toHaveBeenCalledWith(false));
    expect(screen.queryByText("editor-toolbar.upload")).toBeNull();
  });

  it("shows the preview step for several images and waits for confirmation", async () => {
    const onPick = vi.fn();
    const { container } = render(
      <EcencyImagesUploadDialog show={true} setShow={vi.fn()} onPick={onPick} />
    );

    pickFiles(container, [jpeg("one.jpg"), jpeg("two.jpg")]);

    const uploadButton = await screen.findByText("editor-toolbar.upload");
    expect(uploadMock).not.toHaveBeenCalled();

    fireEvent.click(uploadButton);

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(2));
  });
});
