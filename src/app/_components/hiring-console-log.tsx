"use client";

import useMount from "react-use/lib/useMount";

export function HiringConsoleLog() {
  useMount(() => {
    if (process.env.NODE_ENV === "production") {
      console.log(`@@@@@@@(((((@@@@@@@@@@@@@
@@@(((((((((((((@@@@@@@@@
@((((@@@@@@@@@((((@@@@@@@
@(((@@@(((((@@@((((%@@@@@
((((@@@(((@@@@#((((((((%@
((((@@@((((((((((@@@@((((
((((@@@@@@&&&@@@@@@@@@(((
((((@@@@@@@@@@@@@@@@@((((
(((((%@@@@@@@@@%%(((((((@
@@(((((((((((((((((((@@@@`);
      console.log("%c%s", "font-size: 16px;", "We are looking for talents!");
      console.log(
        "%c%s",
        "font-size: 12px;",
        "Are you developer, looking ways to contribute? \nhttps://github.com/ecency/vision-next \n\n"
      );
    }
  });

  return <></>;
}
