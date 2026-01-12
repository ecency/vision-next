import React from "react";

import { List } from "./index";

import renderer from "react-test-renderer";

import { createBrowserHistory } from "history";

import { globalInstance } from "../../helper/test-helper";
import { withStore } from "../../tests/with-store";

jest.mock("@/defaults", () => ({
  imageServer: "https://images.ecency.com"
}));

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useInfiniteQuery: () => ({
    data: {
      pages: [
        [
          { name: "user1", active: "2020-01-01T00:00:00" },
          { name: "user2", active: "2020-01-02T00:00:00" },
          { name: "user3", active: "2020-01-03T00:00:00" }
        ]
      ]
    },
    isFetching: false,
    fetchNextPage: jest.fn()
  }),
  useQuery: () => ({
    data: [],
    isFetching: false,
    refetch: jest.fn()
  })
}));

const props = {
  global: globalInstance,
  history: createBrowserHistory(),
  account: { name: "foo" },
  addAccount: () => {}
};

const component = withStore(<List {...props} mode="follower" />);

it("(1) Render list", () => {
  expect(component.toJSON()).toMatchSnapshot();
});
