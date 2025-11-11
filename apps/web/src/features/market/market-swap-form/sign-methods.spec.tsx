import { HiveMarketAsset } from "./market-pair";
import renderer from "react-test-renderer";
import React from "react";
import { Props, SignMethods } from "./sign-methods";

describe("SignMethods", function () {
  it("should render sign methods", function () {
    const props: Props = {
      disabled: false,
      fromAmount: "1",
      toAmount: "1",
      marketRate: 1,
      asset: HiveMarketAsset.HIVE,
      toAsset: HiveMarketAsset.HBD,
      loading: false,
      setLoading: jest.fn(),
      onSuccess: jest.fn()
    };
    const component = renderer.create(<SignMethods {...props} />);
    expect(component.toJSON()).toMatchSnapshot();
  });
});
