import React from "react";

import { List } from "./index";
import renderer from "react-test-renderer";
import { createBrowserHistory } from "history";

import {
  dynamicPropsIntance1,
  globalInstance,
  allOver,
  assetSymbolInstance,
  withdrawSavingsInstance
} from "../../helper/test-helper";

jest.mock("@/defaults", () => ({
  imageServer: "https://images.ecency.com"
}));

export const MOCK_MODE = jest.fn().mockReturnValue(1);

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: { queryKey?: unknown[] }) => {
    const key = options?.queryKey ?? [];
    if (key[0] === "wallet" && key[1] === "savings-withdraw") {
      return {
        data: MOCK_MODE() === 1 ? withdrawSavingsInstance : [],
        isLoading: false
      };
    }

    return { data: null, isLoading: false };
  }
}));

const defaultProps = {
  global: globalInstance,
  tokenType: assetSymbolInstance,
  history: createBrowserHistory(),
  account: { name: "foo" },
  dynamicProps: dynamicPropsIntance1,
  addAccount: () => {},
  onHide: () => {}
};

it("(1) Default render", async () => {
  MOCK_MODE.mockReturnValueOnce(1);
  const component = renderer.create(<List {...defaultProps} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(2) Empty list", async () => {
  MOCK_MODE.mockReturnValueOnce(2);
  const component = renderer && renderer.create(<List {...defaultProps} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});
