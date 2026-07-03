import React, { PropsWithChildren } from "react";
import { useLockBodyScroll } from "react-use";
import { useMountTransition } from "@/core/hooks";
import { classNameObject } from "@ui/util";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

export function PopoverSheet({ show, setShow, children }: PropsWithChildren<Props>) {
  // Bottom sheet keeps a real exit slide: mounted holds it in the DOM for the
  // 250ms close transition, open drives the overlay fade + sheet position.
  const { mounted, open } = useMountTransition(show, 250);

  // Keyed on mounted (not show) so the page can't scroll under the sheet
  // while it is still sliding out.
  useLockBodyScroll(mounted);

  return mounted ? (
    <>
      <div
        className={classNameObject({
          "bg-black z-[1040] fixed top-0 left-0 right-0 bottom-0 transition-opacity duration-200":
            true,
          "opacity-50": open,
          "opacity-0": !open
        })}
        onClick={() => setShow(false)}
      />

      <div
        className={classNameObject({
          "fixed z-[1060] overflow-hidden bottom-0 w-full h-[640px] bg-white rounded-t-2xl transition-transform duration-[250ms] ease-out":
            true,
          "translate-y-[160px]": open,
          "translate-y-[640px]": !open
        })}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto h-[480px]">{children}</div>
      </div>
    </>
  ) : (
    <></>
  );
}
