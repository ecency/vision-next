import { tempEntry, TempEntryProps } from "../../utils/temp-entry";
import { fullAccountInstance } from "../test-helper";

jest.mock("../../../package.json", () => ({
  version: "3.0.4",
}));

describe("tempEntry", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2019-04-22T10:20:30Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("(1) Create temp entry", () => {
    const input: TempEntryProps = {
      author: {
        ...fullAccountInstance,
        name: "foo",
        reputation: "6550853848",
      },
      permlink: "lorem",
      parentAuthor: "",
      parentPermlink: "ecency",
      title: "a test post",
      description: "a test post",
      body: "lorem ipsum dolor sit amet",
      tags: ["ecency", "photography"],
    };
    expect(tempEntry(input)).toMatchSnapshot();
  });
});

