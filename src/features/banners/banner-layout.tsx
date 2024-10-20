import { PropsWithChildren } from "react";

export function BannerLayout(props: PropsWithChildren) {
  return (
    <div className="bg-blue-dark-sky text-white p-4 flex flex-col justify-center">
      {props.children}
    </div>
  );
}
