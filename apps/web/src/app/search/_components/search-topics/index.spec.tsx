import React from "react";

import TestRenderer from "react-test-renderer";

import { allOver } from "../../helper/test-helper";
import { createBrowserHistory, createLocation } from "history";
import { StaticRouter } from "react-router-dom";
import { SearchTopics } from "./index";

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
        data: [
          {
            tag: "foo",
            repeat: 10
          },
          {
            tag: "bar",
            repeat: 5
          }
        ],
        isLoading: false
      };
    }
  };
});

const defProps = {
  history: createBrowserHistory(),
  location: createLocation({ search: "q=foo" })
};

it("(1) Default render", async () => {
  const props = { ...defProps };

  const renderer = TestRenderer.create(
    <StaticRouter location="/" context={{}}>
      <SearchTopics {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});

it("(2) No matches", async () => {
  TEST_MODE = 1;
  const props = { ...defProps };

  const renderer = TestRenderer.create(
    <StaticRouter location="/" context={{}}>
      <SearchTopics {...props} />
    </StaticRouter>
  );
  await allOver();
  expect(renderer.toJSON()).toMatchSnapshot();
});
