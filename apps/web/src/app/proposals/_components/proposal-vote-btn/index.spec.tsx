import React from "react";

import renderer from "react-test-renderer";
import { createBrowserHistory, createLocation } from "history";

import { globalInstance, UiInstance, activeUserMaker, allOver } from "../../helper/test-helper";

import { ProposalVoteBtn } from "./index";

let MOCK_MODE: number = 1;

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useInfiniteQuery: () => ({
    data: {
      pages: MOCK_MODE === 2 ? [[{ voter: "foo" }]] : [[]]
    },
    isLoading: false
  })
}));

const defProps = {
  history: createBrowserHistory(),
  location: createLocation({}),
  global: globalInstance,
  users: [],
  activeUser: activeUserMaker("foo"),
  ui: UiInstance,
  signingKey: "",
  proposal: 12,
  setActiveUser: () => {},
  updateActiveUser: () => {},
  deleteUser: () => {},
  toggleUIProp: () => {},
  setSigningKey: () => {}
};

it("(1) Default render.", async () => {
  const props = { ...defProps };

  const component = renderer.create(<ProposalVoteBtn {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});

it("(2) Voted.", async () => {
  MOCK_MODE = 2;

  const props = { ...defProps };

  const component = await renderer.create(<ProposalVoteBtn {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});
