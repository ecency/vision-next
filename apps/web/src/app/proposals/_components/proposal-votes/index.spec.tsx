import React from "react";

import renderer from "react-test-renderer";

import {
  globalInstance,
  dynamicPropsIntance1,
  proposalInstance,
  allOver
} from "../../helper/test-helper";

import { createBrowserHistory } from "history";

import { ProposalVotes } from "./index";
import { withStore } from "../../tests/with-store";

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: () => ({
    data: dynamicPropsIntance1
  }),
  useInfiniteQuery: () => ({
    data: {
      pages: [
        [
          {
            voter: "foo",
            voterAccount: {
              name: "foo",
              reputation: "737836300487609",
              vesting_shares: "246097821.767220 VESTS",
              proxied_vsf_votes: [0, 0, 0, 0]
            }
          },
          {
            voter: "bar",
            voterAccount: {
              name: "bar",
              reputation: "16594056204096",
              vesting_shares: "6299727.662451 VESTS",
              proxied_vsf_votes: ["9603246791382", "1088178168454", 0, 0]
            }
          },
          {
            voter: "baz",
            voterAccount: {
              name: "baz",
              reputation: "16594056204096",
              vesting_shares: "6299727.662451 VESTS",
              proxied_vsf_votes: [0, 0, 0, 0]
            }
          }
        ]
      ]
    },
    isFetching: false,
    fetchNextPage: jest.fn(),
    isError: false
  })
}));

const defProps = {
  history: createBrowserHistory(),
  global: globalInstance,
  proposal: proposalInstance,
  onHide: () => {}
};

it("(1) Default render.", async () => {
  const props = { ...defProps };

  const component = withStore(<ProposalVotes {...props} />);
  await allOver();
  expect(component.toJSON()).toMatchSnapshot();
});
