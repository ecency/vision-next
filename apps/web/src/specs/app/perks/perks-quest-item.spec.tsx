import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PerksQuestItem } from "@/app/perks/components/perks-quest-item";

// i18next is globally mocked to echo the key, so cap copy renders as its key.

describe("PerksQuestItem", () => {
  it("renders the title and the progress fraction when no hint is given", () => {
    render(
      <PerksQuestItem
        icon={<i data-testid="icon" />}
        title="Publish a post"
        progress={1}
        goal={3}
      />
    );

    expect(screen.getByText("Publish a post")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("shows the hint instead of the fraction when provided", () => {
    render(
      <PerksQuestItem icon={<i />} title="Daily spin" progress={0} goal={1} hint="Available now" />
    );

    expect(screen.getByText("Available now")).toBeInTheDocument();
    expect(screen.queryByText("0/1")).not.toBeInTheDocument();
  });

  it("swaps the icon for the completion check when completed", () => {
    render(
      <PerksQuestItem
        icon={<i data-testid="icon" />}
        title="Check in"
        progress={1}
        goal={1}
        completed
      />
    );

    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("is keyboard-accessible and fires onClick on click, Enter and Space", () => {
    const onClick = vi.fn();
    render(
      <PerksQuestItem icon={<i />} title="Daily spin" progress={0} goal={1} onClick={onClick} />
    );

    const card = screen.getByRole("button");
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("has no button role when not clickable", () => {
    render(<PerksQuestItem icon={<i />} title="Reblog a post" progress={0} goal={1} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the max-rewards label once progress reaches the cap", () => {
    render(<PerksQuestItem icon={<i />} title="Curate posts" progress={20} goal={10} cap={20} />);
    expect(screen.getByText(/perks\.quests\.max-rewards/)).toBeInTheDocument();
  });

  it("does not show the max-rewards label below the cap", () => {
    render(<PerksQuestItem icon={<i />} title="Curate posts" progress={5} goal={10} cap={20} />);
    expect(screen.queryByText(/perks\.quests\.max-rewards/)).not.toBeInTheDocument();
  });
});
