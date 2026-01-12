import React from "react";

import { FavoriteBtn } from "./index";

import TestRenderer from "react-test-renderer";

import { UiInstance, activeUserInstance, allOver } from "../../helper/test-helper";

let TEST_MODE = 0;

jest.mock("@ecency/sdk", () => ({
  getActiveAccountFavouritesQueryOptions: (_activeUsername?: string) => ({
    queryKey: ["favourites"],
    queryFn: () =>
      new Promise((resolve) => {
        if (TEST_MODE === 0) {
          resolve([]);
        }

        if (TEST_MODE === 1) {
          resolve([{ account: "bar" }]);
        }
      })
  }),
  useAccountFavouriteAdd: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useAccountFavouriteDelete: () => ({ mutateAsync: jest.fn(), isPending: false })
}));

const defProps = {
  targetUsername: "bar",
  activeUser: null,
  users: [],
  ui: UiInstance,
  setActiveUser: () => {},
  updateActiveUser: () => {},
  deleteUser: () => {},
  toggleUIProp: () => {}
};

it("(1) No active user", () => {
  const props = { ...defProps };
  const renderer = TestRenderer.create(<FavoriteBtn {...props} />);
  expect(renderer.toJSON()).toMatchSnapshot();
});

it("(2) Not Favorited", async () => {
  const props = {
    ...defProps,
    activeUser: { ...activeUserInstance }
  };

  const component = TestRenderer.create(<FavoriteBtn {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(3) Favorited", async () => {
  TEST_MODE = 1;

  const props = {
    ...defProps,
    activeUser: { ...activeUserInstance }
  };

  const component = TestRenderer.create(<FavoriteBtn {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});
