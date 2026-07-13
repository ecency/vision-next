// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/ui", () => ({
  Button: "button",
  FormControl: "input",
  Modal: "div",
  ModalBody: "div",
  ModalFooter: "div",
  ModalHeader: "div"
}));

vi.mock("@ui/spinner", () => ({ Spinner: "span" }));

vi.mock("i18next", () => ({
  default: { t: (key: string) => key }
}));

import { fetchImport } from "@/app/publish/_components/publish-import-dialog";

describe("fetchImport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the generic import error when a gateway returns non-JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response("All origin servers are unavailable", { status: 502 })
    ));

    await expect(fetchImport("https://example.com/post")).rejects.toThrow(
      "publish.import-failed"
    );
  });
});
