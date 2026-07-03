import { render } from "@testing-library/react";
import { LineChart } from "@/app/(staticPages)/creator-economy/_components/charts";

const labels = ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"];

describe("LineChart", () => {
  it("renders one hover band per point with an exact-value readout", () => {
    const { container } = render(
      <LineChart
        labels={labels}
        series={[{ name: "USD", values: [100, 250, 200, 150] }]}
        ariaLabel="usd"
      />
    );
    const bands = container.querySelectorAll(".ce-hband");
    expect(bands).toHaveLength(labels.length);
    // readout carries the quarter and the formatted value
    expect(bands[1].textContent).toContain("Q2 2023");
    expect(bands[1].textContent).toContain("250");
  });

  it("names each series in multi-series readouts", () => {
    const { container } = render(
      <LineChart
        labels={labels}
        series={[
          { name: "Posts", values: [10, 20, 30, 40] },
          { name: "Comments", values: [1000, 2000, 3000, 4000] }
        ]}
        ariaLabel="content"
      />
    );
    const band = container.querySelectorAll(".ce-hband")[2];
    expect(band.textContent).toContain("Posts");
    expect(band.textContent).toContain("Comments");
    // readouts are full-precision by design (review: compact defeated the purpose)
    expect(band.textContent).toContain("3,000");
  });

  it("never emits svg title elements (document-title streaming hazard)", () => {
    const { container } = render(
      <LineChart labels={labels} series={[{ name: "USD", values: [1, 2, 3, 4] }]} ariaLabel="x" />
    );
    expect(container.querySelectorAll("svg title")).toHaveLength(0);
  });
});
