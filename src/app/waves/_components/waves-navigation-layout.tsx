import { PropsWithChildren } from "react";

export function WavesNavigationLayout(props: PropsWithChildren<{}>) {
  return (
    <div className="absolute top-[64px] md:top-[69px] z-10 left-0 w-full md:p-2">
      <div className="max-w-[1600px] mx-auto text-sm font-semibold px-4 overflow-x-auto flex items-center justify-around bg-white dark:bg-dark-200 w-full gap-4 rounded-b-2xl">
        {props.children}
      </div>
    </div>
  );
}
