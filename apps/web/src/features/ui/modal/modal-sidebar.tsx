import { classNameObject } from "@ui/util";
import { PropsWithChildren, useContext } from "react";
import { Modal } from "@/features/ui";
import { ModalContext } from "./modal-context";

interface Props {
  show: boolean;
  setShow: (value: boolean) => void;
  placement: "right" | "left";
  className?: string;
}

function SidebarSurface({
  children,
  placement,
  className
}: PropsWithChildren<Pick<Props, "placement" | "className">>) {
  // `open` comes from the Modal's mount-transition machine: false on the first
  // mounted frame (so the drawer enters from off-screen) and during exit (so
  // it slides back out before the timer unmounts the modal). translate-x-full
  // is 100% of the drawer's own width, so any min-width fully clears the
  // viewport — the old fixed 320px slide left wider drawers partially visible.
  const { open } = useContext(ModalContext);

  return (
    <div
      className={classNameObject({
        "ecency-sidebar h-full-dynamic overflow-y-auto no-scrollbar bg-white dark:bg-dark-700 absolute w-[20rem] top-0 bottom-0 transition-transform duration-300 ease-out":
          true,
        "right-0 rounded-l-2xl": placement === "right",
        "left-0 rounded-r-2xl": placement === "left",
        "translate-x-0": open,
        "translate-x-full": !open && placement === "right",
        "-translate-x-full": !open && placement === "left",
        [className ?? ""]: !!className
      })}
    >
      {children}
    </div>
  );
}

export function ModalSidebar({
  children,
  show,
  setShow,
  placement,
  className
}: PropsWithChildren<Props>) {
  return (
    <Modal
      raw={true}
      animation={false}
      show={show}
      onHide={() => setShow(false)}
      className={className}
      exitDurationMs={300}
    >
      <SidebarSurface placement={placement} className={className}>
        {children}
      </SidebarSurface>
    </Modal>
  );
}
