import { parseAsset } from "../../utils/parse-asset";

describe("Parse asset(token)", () => {
  it("(1) should parse", () => {
    const input = "18.494 HBD";
    expect(parseAsset(input)).toMatchSnapshot();
  });

  it("(2) should parse", () => {
    const input = "0.012 HIVE";
    expect(parseAsset(input)).toMatchSnapshot();
  });

  it("(3) should fallback on malformed string", () => {
    const input = "0";
    expect(parseAsset(input)).toMatchSnapshot();
  });

  it("(4) should handle empty value", () => {
    const input = undefined as unknown as string;
    expect(parseAsset(input)).toMatchSnapshot();
  });
});
