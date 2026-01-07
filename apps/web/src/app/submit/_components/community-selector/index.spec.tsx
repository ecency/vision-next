import React from "react";

import { Browser, CommunitySelector } from "./index";

import { activeUserMaker, allOver, globalInstance } from "../../helper/test-helper";
import { withStore } from "../../tests/with-store";

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (options: { queryKey?: unknown[] }) => {
      const key = options?.queryKey ?? [];
      if (key[0] === "community") {
        const name = key[1];
        return {
          data:
            name === "hive-125125"
              ? { name: "hive-125125", title: "Ecency" }
              : null,
          isLoading: false
        };
      }

      if (key[0] === "accounts" && key[1] === "subscriptions") {
        return {
          data: [
            ["hive-125125", "Ecency"],
            ["hive-131131", "Foo"],
            ["hive-145145", "Bar"]
          ],
          isLoading: false
        };
      }

      if (key[0] === "communities") {
        return {
          data: [
            { name: "hive-125125", title: "Ecency", about: "" },
            { name: "hive-131131", title: "Foo", about: "" },
            { name: "hive-145145", title: "Bar", about: "" }
          ],
          isLoading: false
        };
      }

      return { data: null, isLoading: false };
    }
  };
});

const defProps = {
  global: globalInstance,
  activeUser: activeUserMaker("foo"),
  onSelect: () => {}
};

it("(1) Empty tags.", async () => {
  const props = {
    ...defProps,
    tags: []
  };
  const component = withStore(<CommunitySelector {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(2) Tags with no community", async () => {
  const props = {
    ...defProps,
    tags: ["foo", "bar"]
  };
  const component = withStore(<CommunitySelector {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(3) Tags with community. but in the end", async () => {
  const props = {
    ...defProps,
    tags: ["foo", "bar", "hive-125125"]
  };
  const component = withStore(<CommunitySelector {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(4) Tags with community.", async () => {
  const props = {
    ...defProps,
    tags: ["hive-125125", "foo", "bar"]
  };
  const component = withStore(<CommunitySelector {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(5) Tags with community. But not valid", async () => {
  const props = {
    ...defProps,
    tags: ["hive-122122", "foo", "bar"]
  };
  const component = withStore(<CommunitySelector {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(6) Browser", async () => {
  const props = {
    ...defProps,
    onHide: () => {}
  };
  const component = withStore(<Browser {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});
