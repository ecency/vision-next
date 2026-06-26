import React from "react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Popover } from "@ui/popover";

// Exercises the REAL Popover (floating-ui + portal + framer-motion), unlike
// popover-confirm.spec which mocks it.
describe("Popover defaultShow (uncontrolled)", () => {
  it("stays open after mount when defaultShow is set — the props.show sync effect must NOT reset an uncontrolled popover to closed", async () => {
    render(
      <Popover behavior="hover" defaultShow={true} directContent={<span>label</span>}>
        <div>PREVIEW_CONTENT</div>
      </Popover>
    );
    // findBy* waits a tick so the mount effect runs; with the bug it would call
    // setShow(false) and the content would disappear.
    expect(await screen.findByText("PREVIEW_CONTENT")).toBeInTheDocument();
  });

  it("starts closed when uncontrolled and no defaultShow is given", () => {
    render(
      <Popover behavior="hover" directContent={<span>label</span>}>
        <div>HIDDEN_CONTENT</div>
      </Popover>
    );
    expect(screen.queryByText("HIDDEN_CONTENT")).toBeNull();
  });
});
