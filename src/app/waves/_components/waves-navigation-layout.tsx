import { PropsWithChildren } from "react";

export function WavesNavigationLayout(props: PropsWithChildren<{}>) {
  return (
    <div className="absolute top-[64px] md:top-[96px] z-10 left-0 w-full md:p-2">
      <div className="max-w-[1600px] mx-auto text-sm font-semibold px-6 flex items-center justify-between w-full gap-4">
        {props.children}
      </div>
    </div>
  );
}
