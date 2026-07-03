import { classNameObject } from "@ui/util";
import { PropsWithChildren } from "react";
import { Modal } from "@/features/ui";
import { motion, PresenceContext } from "framer-motion";

interface Props {
  show: boolean;
  setShow: (value: boolean) => void;
  placement: "right" | "left";
  className?: string;
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
    >
      <motion.div
        initial={{
          x: (placement === "right" ? 1 : -1) * 320
        }}
        animate={{
          x: 0
        }}
        transition={{
          duration: 0.3,
          stiffness: 0
        }}
        exit={{
          x: (placement === "right" ? 1 : -1) * 320
        }}
        className={classNameObject({
          "ecency-sidebar h-full-dynamic overflow-y-auto no-scrollbar bg-white dark:bg-dark-700 absolute w-[20rem] top-0 bottom-0":
            true,
          "right-0 rounded-l-2xl": placement === "right",
          "left-0 rounded-r-2xl": placement === "left",
          [className ?? ""]: !!className
        })}
      >
        {/* AnimatePresence only removes the exiting sidebar once every motion
            component registered under it reports exit-complete. Live content
            (e.g. a notification arriving mid-close mounts a new animated list
            item) registers with the exiting presence but never completes,
            leaving the sidebar stuck on screen until a reload. Nulling the
            presence context for children keeps them out of that bookkeeping;
            the sliding container above still participates and animates out. */}
        <PresenceContext.Provider value={null}>{children}</PresenceContext.Provider>
      </motion.div>
    </Modal>
  );
}
