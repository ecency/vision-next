import { vi } from 'vitest';
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Stepper } from "@/features/shared/stepper";

describe("Stepper", () => {
  const mockSteps = [
    {
      step: 1,
      title: "Step 1 Title",
      icon: <div data-testid="icon-1">Icon 1</div>,
      description: "Step 1 Description"
    },
    {
      step: 2,
      title: "Step 2 Title",
      icon: <div data-testid="icon-2">Icon 2</div>,
      description: "Step 2 Description"
    },
    {
      step: 3,
      title: "Step 3 Title",
      icon: <div data-testid="icon-3">Icon 3</div>,
      description: "Step 3 Description"
    }
  ];

  test("renders all steps", () => {
    render(<Stepper steps={mockSteps} currentStep={1} />);

    expect(screen.getByText("Step 1 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 2 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 3 Title")).toBeInTheDocument();
  });

  test("renders all step descriptions", () => {
    render(<Stepper steps={mockSteps} currentStep={1} />);

    expect(screen.getByText("Step 1 Description")).toBeInTheDocument();
    expect(screen.getByText("Step 2 Description")).toBeInTheDocument();
    expect(screen.getByText("Step 3 Description")).toBeInTheDocument();
  });

  test("renders all step icons", () => {
    render(<Stepper steps={mockSteps} currentStep={1} />);

    expect(screen.getByTestId("icon-1")).toBeInTheDocument();
    expect(screen.getByTestId("icon-2")).toBeInTheDocument();
    expect(screen.getByTestId("icon-3")).toBeInTheDocument();
  });

  test("renders with string step identifiers", () => {
    const stepsWithStringIds = [
      {
        step: "first",
        title: "First Step",
        icon: <div>Icon</div>,
        description: "First Description"
      },
      {
        step: "second",
        title: "Second Step",
        icon: <div>Icon</div>,
        description: "Second Description"
      }
    ];

    render(<Stepper steps={stepsWithStringIds} currentStep="first" />);

    expect(screen.getByText("First Step")).toBeInTheDocument();
    expect(screen.getByText("Second Step")).toBeInTheDocument();
  });

  test("renders with empty steps array", () => {
    const { container } = render(<Stepper steps={[]} currentStep={1} />);

    expect(container.querySelector(".gap-4")).toBeInTheDocument();
  });

  test("updates when currentStep changes", () => {
    const { rerender } = render(<Stepper steps={mockSteps} currentStep={1} />);

    expect(screen.getByText("Step 1 Title")).toBeInTheDocument();

    rerender(<Stepper steps={mockSteps} currentStep={2} />);

    expect(screen.getByText("Step 2 Title")).toBeInTheDocument();
  });

  test("handles single step", () => {
    const singleStep = [
      {
        step: 1,
        title: "Only Step",
        icon: <div>Icon</div>,
        description: "Only Description"
      }
    ];

    render(<Stepper steps={singleStep} currentStep={1} />);

    expect(screen.getByText("Only Step")).toBeInTheDocument();
    expect(screen.getByText("Only Description")).toBeInTheDocument();
  });

  test("renders icons as ReactNode correctly", () => {
    const stepsWithComplexIcons = [
      {
        step: 1,
        title: "Step with SVG",
        icon: (
          <svg data-testid="svg-icon">
            <circle cx="10" cy="10" r="5" />
          </svg>
        ),
        description: "Description"
      }
    ];

    render(<Stepper steps={stepsWithComplexIcons} currentStep={1} />);

    expect(screen.getByTestId("svg-icon")).toBeInTheDocument();
  });

  test("applies correct container classes", () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={1} />);

    const stepperContainer = container.querySelector(".gap-4");
    expect(stepperContainer).toHaveClass("gap-4", "lg:gap-6", "hidden", "md:grid", "xl:gap-8", "pt-8");
  });

  test("handles mixed numeric and string step identifiers", () => {
    const mixedSteps = [
      {
        step: 1,
        title: "Numeric Step",
        icon: <div>Icon</div>,
        description: "Numeric Description"
      },
      {
        step: "string-step",
        title: "String Step",
        icon: <div>Icon</div>,
        description: "String Description"
      }
    ];

    render(<Stepper steps={mixedSteps} currentStep={1} />);

    expect(screen.getByText("Numeric Step")).toBeInTheDocument();
    expect(screen.getByText("String Step")).toBeInTheDocument();
  });

  test("renders with currentStep that doesn't match any step", () => {
    render(<Stepper steps={mockSteps} currentStep={999} />);

    expect(screen.getByText("Step 1 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 2 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 3 Title")).toBeInTheDocument();
  });

  test("maintains step order", () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={1} />);

    const stepElements = container.querySelectorAll(".flex.text-sm");
    expect(stepElements).toHaveLength(3);
  });
});
