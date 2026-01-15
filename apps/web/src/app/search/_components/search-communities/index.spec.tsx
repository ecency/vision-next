import React from "react";

import TestRenderer from "react-test-renderer";

import { globalInstance, communityInstance1, allOver } from "../../helper/test-helper";
import { createBrowserHistory, createLocation } from "history";
import { StaticRouter } from "react-router-dom";

import { SearchCommunities } from "./index";
import { withStore } from "../../tests/with-store";

let TEST_MODE = 0;

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => {
      if (TEST_MODE === 1) {
        return {
          data: [],
          isLoading: false
        };
      }

      return {
        data: [communityInstance1],
        isLoading: false
      };
    }
  };
});

const defProps = {
  history: createBrowserHistory(),
  location: createLocation({ search: "q=foo" }),
  global: globalInstance
};

it("(1) Default render", async () => {
  const props = { ...defProps };

  const renderer = withStore(
    <StaticRouter location="/" context={{}}>
      <SearchCommunities {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});

it("(2) No matches", async () => {
  TEST_MODE = 1;
  const props = { ...defProps };

  const renderer = withStore(
    <StaticRouter location="/" context={{}}>
      <SearchCommunities {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});
