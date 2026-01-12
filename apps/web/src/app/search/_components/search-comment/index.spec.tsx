import React from "react";

import TestRenderer from "react-test-renderer";

import mockDate from "mockdate";
import { createBrowserHistory, createLocation } from "history";
import { StaticRouter } from "react-router-dom";

import { globalInstance, allOver, searchResponseInstance } from "../../helper/test-helper";

import { SearchComment } from "./index";
import { withStore } from "../../tests/with-store";

mockDate.set(1591398131174);

let TEST_MODE = 0;

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useInfiniteQuery: () => {
      if (TEST_MODE === 1) {
        return {
          data: { pages: [{ ...searchResponseInstance, hits: 4 }], pageParams: [] },
          isLoading: false,
          fetchNextPage: jest.fn(),
          hasNextPage: false
        };
      }

      if (TEST_MODE === 2) {
        return {
          data: { pages: [{ ...searchResponseInstance, hits: 0, results: [] }], pageParams: [] },
          isLoading: false,
          fetchNextPage: jest.fn(),
          hasNextPage: false
        };
      }

      return {
        data: { pages: [searchResponseInstance], pageParams: [] },
        isLoading: false,
        fetchNextPage: jest.fn(),
        hasNextPage: false
      };
    }
  };
});

const defProps = {
  history: createBrowserHistory(),
  location: createLocation({ search: "q=foo" }),
  global: globalInstance,
  addAccount: () => {}
};

it("(1) Default render", async () => {
  const props = { ...defProps };

  const renderer = withStore(
    <StaticRouter location="/" context={{}}>
      <SearchComment {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});

it("(2) With limit", async () => {
  const props = {
    ...defProps,
    limit: 8
  };

  const renderer = withStore(
    <StaticRouter location="/" context={{}}>
      <SearchComment {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});

it("(3) Hide show more button", async () => {
  TEST_MODE = 1;

  const props = {
    ...defProps,
    limit: 8
  };

  const renderer = withStore(
    <StaticRouter location="/" context={{}}>
      <SearchComment {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});

it("(4) No matches", async () => {
  TEST_MODE = 2;

  const props = {
    ...defProps
  };

  const renderer = withStore(
    <StaticRouter location="/" context={{}}>
      <SearchComment {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});
