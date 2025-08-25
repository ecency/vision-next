import React from "react";

import { ProfileLink } from "./index";
import TestRenderer from "react-test-renderer";

it("(1) Render", () => {
  const renderer = TestRenderer.create(
    <ProfileLink username="username">
      <span>username</span>
    </ProfileLink>
  );
  expect(renderer.toJSON()).toMatchSnapshot();
});
