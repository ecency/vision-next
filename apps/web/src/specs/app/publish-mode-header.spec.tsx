import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PublishModeHeader } from "@/app/publish/_components/publish-mode-header";

// i18next is globally mocked (see setup-any-spec.ts) to echo keys, so
// t("publish.auto-save") renders as the literal "publish.auto-save".
describe("PublishModeHeader", () => {
  it("renders the provided mode label", () => {
    render(<PublishModeHeader label="New Content" />);
    expect(screen.getByText("New Content")).toBeInTheDocument();
  });

  it("shows the auto-saved time when lastSaved is provided", () => {
    render(<PublishModeHeader label="Draft Editing" lastSaved={new Date("2026-06-04T10:06:46Z")} />);
    expect(screen.getByText("Draft Editing")).toBeInTheDocument();
    expect(screen.getByText(/publish\.auto-save/)).toBeInTheDocument();
  });

  it("omits the auto-saved time when lastSaved is null", () => {
    render(<PublishModeHeader label="Post Editing" lastSaved={null} />);
    expect(screen.getByText("Post Editing")).toBeInTheDocument();
    expect(screen.queryByText(/publish\.auto-save/)).not.toBeInTheDocument();
  });

  it("omits the auto-saved time when lastSaved is omitted", () => {
    render(<PublishModeHeader label="New Content" />);
    expect(screen.queryByText(/publish\.auto-save/)).not.toBeInTheDocument();
  });
});
