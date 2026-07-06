import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";
import { PublishModeHeader } from "@/app/publish/_components/publish-mode-header";

// i18next is globally mocked (see setup-any-spec.ts) to echo keys, so
// t("publish.auto-save") renders as the literal "publish.auto-save".
// A QueryClient is required since the header renders the QuestStreakChip.
describe("PublishModeHeader", () => {
  it("renders the provided mode label", () => {
    renderWithQueryClient(<PublishModeHeader label="New Content" />);
    expect(screen.getByText("New Content")).toBeInTheDocument();
  });

  it("shows the auto-saved time when lastSaved is provided", () => {
    renderWithQueryClient(
      <PublishModeHeader label="Draft Editing" lastSaved={new Date("2026-06-04T10:06:46Z")} />
    );
    expect(screen.getByText("Draft Editing")).toBeInTheDocument();
    expect(screen.getByText(/publish\.auto-save/)).toBeInTheDocument();
  });

  it("omits the auto-saved time when lastSaved is null", () => {
    renderWithQueryClient(<PublishModeHeader label="Post Editing" lastSaved={null} />);
    expect(screen.getByText("Post Editing")).toBeInTheDocument();
    expect(screen.queryByText(/publish\.auto-save/)).not.toBeInTheDocument();
  });

  it("omits the auto-saved time when lastSaved is omitted", () => {
    renderWithQueryClient(<PublishModeHeader label="New Content" />);
    expect(screen.queryByText(/publish\.auto-save/)).not.toBeInTheDocument();
  });
});
